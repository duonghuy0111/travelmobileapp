# from rest_framework import viewsets, permissions, generics, status, filters
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.pagination import PageNumberPagination
# from rest_framework.parsers import MultiPartParser
#
# from .models import Category, TravelService, User, Booking, Rating
# from .serializers import (
#     CategorySerializer, TravelServiceSerializer,
#     UserSerializer, BookingSerializer
# )
#
#
# # 1. Cấu hình Phân trang (20 items/trang theo đề bài)
# class StandardPagination(PageNumberPagination):
#     page_size = 20
#     page_size_query_param = 'page_size'
#     max_page_size = 100
#
#
# # 2. API Quản lý User (Đăng ký, Lấy thông tin cá nhân)
# class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
#     queryset = User.objects.filter(is_active=True)
#     serializer_class = UserSerializer
#     parser_classes = [MultiPartParser, ]  # Để upload ảnh avatar
#
#     # API lấy thông tin user đang đăng nhập
#     # URL: /users/current-user/
#     @action(methods=['get'], detail=False, url_path='current-user')
#     def current_user(self, request):
#         if not request.user.is_authenticated:
#             return Response({"error": "Chưa đăng nhập"}, status=status.HTTP_401_UNAUTHORIZED)
#         return Response(self.serializer_class(request.user).data)
#
#
# # 3. API Danh mục
# class CategoryViewSet(viewsets.ModelViewSet):
#     queryset = Category.objects.filter(active=True)
#     serializer_class = CategorySerializer
#     # Ai cũng xem được, nhưng chỉ Admin mới sửa được (tạm thời để AllowAny cho dễ test)
#     permission_classes = [permissions.AllowAny]
#
#
# # 4. API Dịch vụ Tour (Core Feature)
# class TravelServiceViewSet(viewsets.ModelViewSet):
#     """
#     API hỗ trợ:
#     - Tìm kiếm (?q=Đà Nẵng)
#     - Lọc theo danh mục (?category_id=1)
#     - Sắp xếp giá (?ordering=price hoặc -price)
#     """
#     queryset = TravelService.objects.filter(active=True)
#     serializer_class = TravelServiceSerializer
#     pagination_class = StandardPagination
#
#     # Cấu hình bộ lọc và tìm kiếm
#     filter_backends = [filters.SearchFilter, filters.OrderingFilter]
#     search_fields = ['name', 'location']  # Tìm theo tên hoặc địa điểm
#     ordering_fields = ['price', 'created_date']
#
#     # Hàm lọc nâng cao (nếu cần lọc chính xác theo Category)
#     def get_queryset(self):
#         queryset = self.queryset
#
#         # Lọc theo danh mục: /services/?category_id=1
#         cate_id = self.request.query_params.get('category_id')
#         if cate_id:
#             queryset = queryset.filter(category_id=cate_id)
#
#         return queryset
#
#     # Khi tạo Tour, tự động lấy User đang login làm Provider
#     def perform_create(self, serializer):
#         serializer.save(provider=self.request.user)
#
#
# # 5. API Đặt vé (Booking)
# class BookingViewSet(viewsets.ModelViewSet):
#     queryset = Booking.objects.all()
#     serializer_class = BookingSerializer
#     permission_classes = [permissions.IsAuthenticated]  # Bắt buộc đăng nhập mới được đặt
#
#     def perform_create(self, serializer):
#         # Tự động tính tổng tiền = Giá tour * Số lượng khách
#         service = serializer.validated_data['service']
#         quantity = serializer.validated_data['quantity']
#         total = service.price * quantity
#
#         # Lưu vào database
#         serializer.save(user=self.request.user, total_price=total)


from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser
from django.db import transaction
from django.db.models import Sum, Count, F
from django.db.models.functions import TruncMonth

from .models import Category, TravelService, User, Booking, Rating
from .serializers import (
    CategorySerializer, TravelServiceSerializer,
    UserSerializer, BookingSerializer
)
from .perms import IsProvider, IsOwner


# 1. Phân trang
class StandardPagination(PageNumberPagination):
    page_size = 20


# 2. User ViewSet
class UserViewSet(viewsets.ViewSet, generics.CreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    parser_classes = [MultiPartParser, ]

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


# 4. Travel Service ViewSet (Xử lý Tour)
class TravelServiceViewSet(viewsets.ModelViewSet):
    queryset = TravelService.objects.filter(active=True)
    serializer_class = TravelServiceSerializer
    pagination_class = StandardPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'location']
    ordering_fields = ['price', 'created_date']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'comments']:
            return [permissions.AllowAny()]
        return [IsProvider()]  # Chỉ nhà cung cấp mới được thêm/sửa/xóa

    def get_queryset(self):
        queryset = self.queryset
        cate_id = self.request.query_params.get('category_id')
        if cate_id:
            queryset = queryset.filter(category_id=cate_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)

        # API lấy comment (GET) và Thêm comment (POST)
        # URL: /services/{id}/comments/

    @action(methods=['get', 'post'], detail=True, url_path='comments')
    def comments(self, request, pk=None):
        service = self.get_object()

        # --- XỬ LÝ KHI NGƯỜI DÙNG ĐĂNG BÌNH LUẬN (POST) ---
        if request.method == 'POST':
            # Bắt buộc phải đăng nhập mới được comment
            if not request.user.is_authenticated:
                return Response({"error": "Vui lòng đăng nhập"}, status=status.HTTP_401_UNAUTHORIZED)

            content = request.data.get('content')
            rate = request.data.get('rating', 5)

            # Tạo comment mới vào DB
            # Lưu ý: Cần đảm bảo model Rating của bạn có field 'comment' và 'rate'
            c = Rating.objects.create(
                user=request.user,
                service=service,
                comment=content,
                rate=rate
            )

            # Trả về dữ liệu chuẩn format Frontend cần
            return Response({
                "id": c.id,
                "content": c.comment,
                "rate": c.rate,
                "created_date": c.created_date,
                "user": {
                    "username": request.user.username,
                    "avatar": request.user.avatar.url if request.user.avatar else ""
                }
            }, status=status.HTTP_201_CREATED)

        # --- XỬ LÝ KHI LẤY DANH SÁCH (GET) ---
        # Lấy danh sách comment, sắp xếp mới nhất lên đầu
        # Lưu ý: 'ratings' là related_name trong models.py. Nếu bạn đặt tên khác (vd: rating_set) thì sửa lại chỗ này.
        ratings = service.ratings.select_related('user').filter(active=True).order_by('-created_date')

        return Response([{
            "id": r.id,
            "content": r.comment,  # Frontend dùng biến 'content'
            "rate": r.rate,
            "created_date": r.created_date,
            "user": {
                "username": r.user.username,
                "avatar": r.user.avatar.url if r.user.avatar else ""
            }
        } for r in ratings])


# 5. Booking ViewSet (Xử lý Đặt vé - QUAN TRỌNG)
class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    # --- PHÂN QUYỀN DỮ LIỆU ---
    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Booking.objects.all()
        elif user.role == 'PROVIDER':
            # Provider xem đơn đặt các tour của mình
            return Booking.objects.filter(service__provider=user)
        else:
            # Khách chỉ xem đơn mình đặt
            return Booking.objects.filter(user=user)

    # --- LOGIC ĐẶT VÉ & TRỪ CHỖ TRỐNG ---
    def create(self, request, *args, **kwargs):
        service_id = request.data.get('service')
        quantity = int(request.data.get('quantity', 1))

        try:
            # Dùng transaction để đảm bảo tính toàn vẹn (tránh 2 người đặt cùng lúc bị lỗi)
            with transaction.atomic():
                # Khóa dòng dữ liệu service lại để xử lý
                service = TravelService.objects.select_for_update().get(pk=service_id)

                if service.slots_available < quantity:
                    return Response(
                        {"error": "Rất tiếc, số lượng vé còn lại không đủ!"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Trừ số chỗ
                service.slots_available -= quantity
                service.save()

                # Lưu Booking
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                serializer.save(user=request.user, total_price=service.price * quantity)

                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except TravelService.DoesNotExist:
            return Response({"error": "Dịch vụ không tồn tại"}, status=status.HTTP_404_NOT_FOUND)


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