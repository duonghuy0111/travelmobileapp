from rest_framework import serializers
from .models import Category, TravelService, User, Booking, Rating


# 1. Serializer cho User (Dùng để đăng ký và hiển thị thông tin)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'password', 'email', 'avatar', 'role', 'is_verified']
        extra_kwargs = {
            'password': {'write_only': True}  # Chỉ cho phép ghi password, không bao giờ trả về password khi xem
        }

    # Hàm này chạy khi đăng ký user mới (để mã hóa password)
    def create(self, validated_data):
        user = User(**validated_data)
        user.set_password(validated_data['password'])  # Mã hóa password (băm)
        user.save()
        return user


# 2. Serializer cho Danh mục
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


# 3. Serializer cho Tour (Quan trọng nhất)
class TravelServiceSerializer(serializers.ModelSerializer):
    # Lấy thêm thông tin chi tiết thay vì chỉ hiện ID
    category_id = serializers.IntegerField(write_only=True)  # Nhập vào ID
    category = CategorySerializer(read_only=True)  # Trả ra object chi tiết

    # Hiển thị thông tin nhà cung cấp gọn nhẹ (chỉ cần tên và avatar)
    provider = UserSerializer(read_only=True)

    # Xử lý đường dẫn ảnh đầy đủ
    image = serializers.SerializerMethodField()

    def get_image(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    class Meta:
        model = TravelService
        fields = ['id', 'name', 'description', 'price', 'location',
                  'start_date', 'duration', 'slots_total', 'slots_available',
                  'image', 'category', 'category_id', 'provider', 'active']


# # 4. Serializer cho Booking (Đặt vé)
# class BookingSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Booking
#         fields = ['id', 'user', 'service', 'quantity', 'total_price',
#                   'status', 'payment_method', 'created_date']


# ... (Các serializer khác giữ nguyên)

class BookingSerializer(serializers.ModelSerializer):
    # Cho phép hiển thị thông tin Service chi tiết khi xem đơn hàng
    service_detail = TravelServiceSerializer(source='service', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'user', 'service', 'service_detail', 'quantity', 'total_price',
                  'status', 'payment_method', 'created_date']
        read_only_fields = ['user', 'total_price', 'created_date'] # Không cho user sửa mấy cái này