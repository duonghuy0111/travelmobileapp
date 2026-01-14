from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import transaction
from django.db.models import Sum, Count, F,Avg, Q
from django.db.models.functions import TruncMonth

from .models import Category, TravelService, User, Booking, Rating, Like
from .serializers import (
    CategorySerializer, TravelServiceSerializer,
    UserSerializer, BookingSerializer
)
from .perms import IsProvider, IsOwner

from django.db.models.functions import TruncMonth, TruncYear, TruncQuarter  # <--- Import thêm



# 1. Phân trang
class StandardPagination(PageNumberPagination):
    page_size = 20


# 2. User ViewSet
class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, FormParser ]

    def get_permissions(self):
        if self.action == 'current_user':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(methods=['get'], detail=False, url_path='current-user')
    def current_user(self, request):
        return Response(self.serializer_class(request.user).data)


# 3. Category ViewSet
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

# === 4. NÂNG CẤP VIEWSET DỊCH VỤ (Search, Filter, Sort, Rating) ===
class TravelServiceViewSet(viewsets.ModelViewSet):
    queryset = TravelService.objects.filter(active=True)
    serializer_class = TravelServiceSerializer
    pagination_class = StandardPagination
    permission_classes = [permissions.AllowAny]

    # Cho phép tìm kiếm cơ bản
    search_fields = ['name', 'location']

    # Cho phép sắp xếp theo giá, ngày tạo
    ordering_fields = ['price', 'created_date', 'avg_rating', 'booking_count']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'comments']:
            return [permissions.AllowAny()]
        return [IsProvider()]  # Chỉ nhà cung cấp mới được thêm/sửa/xóa

    def perform_create(self, serializer):
        # Khi tạo Tour, tự động gán provider là người đang login
        serializer.save(provider=self.request.user)

    def get_queryset(self):
        queryset = self.queryset

        # 1. ANNOTATE: Tính điểm đánh giá (avg_rating) và độ phổ biến (booking_count)
        # Để Frontend có thể sort theo "Đánh giá cao nhất" hoặc "Phổ biến nhất"
        queryset = queryset.annotate(
            avg_rating=Avg('ratings__rate'),
            booking_count=Count('booking')
        )

        # 2. FILTER NÂNG CAO (Manual Filter)
        # Lọc theo danh mục (Tour/Hotel/Ve)
        cate_id = self.request.query_params.get('category_id')
        if cate_id:
            queryset = queryset.filter(category_id=cate_id)

        # Lọc theo địa điểm (gần đúng)
        location = self.request.query_params.get('location')
        if location:
            queryset = queryset.filter(location__icontains=location)

        # Lọc theo khoảng giá (Min - Max) -> Yêu cầu bắt buộc
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        # Lọc theo ngày khởi hành (Tháng cụ thể)
        month = self.request.query_params.get('month')  # Format: 1, 2, 12
        if month:
            queryset = queryset.filter(start_date__month=month)

        return queryset

    # API để Nhà cung cấp xem danh sách dịch vụ của chính mình
    @action(methods=['get'], detail=False, url_path='my-services', permission_classes=[IsProvider])
    def my_services(self, request):
        services = self.get_queryset().filter(provider=request.user)
        return Response(TravelServiceSerializer(services, many=True, context={'request': request}).data)

    # API Rating: Người dùng đánh giá dịch vụ
    @action(methods=['post'], detail=True, permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        service = self.get_object()
        user = request.user
        rate = request.data.get('rate')
        comment = request.data.get('comment')

        if not rate:
            return Response({"error": "Vui lòng nhập số sao"}, status=status.HTTP_400_BAD_REQUEST)

        # Tạo hoặc cập nhật đánh giá
        rating, created = Rating.objects.update_or_create(
            user=user,
            service=service,
            defaults={'rate': rate, 'comment': comment}
        )
        return Response({"message": "Đánh giá thành công"}, status=status.HTTP_200_OK)


# === 5. BOOKING VIEWSET (Giữ nguyên logic transaction tốt của bạn) ===
class BookingViewSet(viewsets.ModelViewSet):
    # ... (Giữ nguyên code cũ của bạn vì đã xử lý transaction rất tốt) ...
    # Chỉ bổ sung: Khi GET danh sách, Admin thấy hết, Provider thấy của mình, User thấy của mình
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Booking.objects.all().order_by('-created_date')
        elif user.role == 'PROVIDER':
            return Booking.objects.filter(service__provider=user).order_by('-created_date')
        else:
            return Booking.objects.filter(user=user).order_by('-created_date')

    def create(self, request, *args, **kwargs):
        # Lấy thông tin từ request
        user = request.user
        data = request.data

        try:
            # Dùng transaction.atomic để đảm bảo an toàn dữ liệu
            with transaction.atomic():
                # 1. Kiểm tra xem Tour có tồn tại và còn chỗ không
                service_id = data.get('service')
                quantity = int(data.get('quantity', 1))
                payment_method = data.get('payment_method', 'CASH')

                service = TravelService.objects.select_for_update().get(pk=service_id)

                if service.slots_available < quantity:
                    return Response(
                        {"error": "Xin lỗi, tour này không còn đủ chỗ trống!"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # 2. Tính tổng tiền (Server tự tính, không tin tưởng client gửi lên)
                total_price = service.price * quantity

                # 3. Tạo Booking
                booking = Booking.objects.create(
                    user=user,
                    service=service,
                    quantity=quantity,
                    total_price=total_price,
                    payment_method=payment_method,
                    status='PENDING'  # Mặc định là chờ xử lý
                )

                # 4. Trừ số chỗ trống của Tour
                service.slots_available -= quantity
                service.save()

                return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)

        except TravelService.DoesNotExist:
            return Response({"error": "Tour không tồn tại"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# === 6. NÂNG CẤP STATS VIEWSET (Thống kê Tháng, Quý, Năm) ===
class StatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_base_queryset(self, request):
        """Hàm phụ trợ để lấy queryset booking theo quyền"""
        user = request.user
        bookings = Booking.objects.filter(status='CONFIRMED')  # Chỉ tính đơn đã chốt
        if user.role == 'PROVIDER':
            bookings = bookings.filter(service__provider=user)
        elif user.role != 'ADMIN':
            return None
        return bookings

    # Thống kê theo THÁNG
    @action(methods=['get'], detail=False)
    def revenue_by_month(self, request):
        bookings = self._get_base_queryset(request)
        if bookings is None: return Response(status=403)

        data = bookings.annotate(period=TruncMonth('created_date')) \
            .values('period') \
            .annotate(total_revenue=Sum('total_price'), count=Count('id')) \
            .order_by('period')
        return Response(data)

    # Thống kê theo QUÝ (Yêu cầu nâng cao)
    @action(methods=['get'], detail=False)
    def revenue_by_quarter(self, request):
        bookings = self._get_base_queryset(request)
        if bookings is None: return Response(status=403)

        data = bookings.annotate(period=TruncQuarter('created_date')) \
            .values('period') \
            .annotate(total_revenue=Sum('total_price'), count=Count('id')) \
            .order_by('period')
        return Response(data)

    # Thống kê theo NĂM (Yêu cầu nâng cao)
    @action(methods=['get'], detail=False)
    def revenue_by_year(self, request):
        bookings = self._get_base_queryset(request)
        if bookings is None: return Response(status=403)

        data = bookings.annotate(period=TruncYear('created_date')) \
            .values('period') \
            .annotate(total_revenue=Sum('total_price'), count=Count('id')) \
            .order_by('period')
        return Response(data)

# 6. API Thống kê (Dành cho Admin & Provider)
class StatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(methods=['get'], detail=False)
    def revenue_by_month(self, request):
        """Thống kê doanh thu theo tháng"""
        user = request.user

        # Lọc dữ liệu booking
        bookings = Booking.objects.filter(status='CONFIRMED')  # Chỉ tính đơn đã xác nhận

        if user.role == 'PROVIDER':
            bookings = bookings.filter(service__provider=user)
        elif user.role != 'ADMIN':
            return Response({"error": "Không có quyền truy cập"}, status=status.HTTP_403_FORBIDDEN)

        # Query thống kê
        data = bookings.annotate(month=TruncMonth('created_date')) \
            .values('month') \
            .annotate(total_revenue=Sum('total_price'), count=Count('id')) \
            .order_by('month')

        return Response(data)
