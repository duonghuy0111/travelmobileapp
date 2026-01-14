from rest_framework import serializers
from .models import Category, TravelService, User, Booking, Rating

from .models import Like

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


class TravelServiceSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(write_only=True)
    category = CategorySerializer(read_only=True)

    # Field tính toán (read_only)
    avg_rating = serializers.FloatField(read_only=True)  # Điểm trung bình
    booking_count = serializers.IntegerField(read_only=True)  # Số lượt đặt

    def to_representation(self, instance):
        # Hàm này giúp hiển thị full link ảnh nếu cần
        rep = super().to_representation(instance)
        if instance.image:
            rep['image'] = instance.image.url
        return rep

    class Meta:
        model = TravelService
        fields = ['id', 'name', 'description', 'price', 'location',
                  'start_date', 'end_date', 'duration',  # Nhớ thêm end_date
                  'slots_total', 'slots_available', 'image',
                  'category', 'category_id', 'provider', 'active',
                  'avg_rating', 'booking_count']  # Thêm vào fields


class BookingSerializer(serializers.ModelSerializer):
    # Cho phép hiển thị thông tin Service chi tiết khi xem đơn hàng
    service_detail = TravelServiceSerializer(source='service', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'user', 'service', 'service_detail', 'quantity', 'total_price',
                  'status', 'payment_method', 'created_date']
        read_only_fields = ['user', 'total_price', 'created_date'] # Không cho user sửa mấy cái này
