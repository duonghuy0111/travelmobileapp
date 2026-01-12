from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
# from cloudinary.models import CloudinaryField


class User(AbstractUser):
    """
    User model tùy chỉnh theo đề bài:
    - 3 Vai trò: Admin, Provider, Customer.
    - Avatar: Bắt buộc (nhưng để null=True lúc dev cho dễ).
    - is_verified: Quan trọng cho Provider (Admin duyệt mới được đăng bài).
    """

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Quản trị viên"
        PROVIDER = "PROVIDER", "Nhà cung cấp dịch vụ"
        CUSTOMER = "CUSTOMER", "Khách hàng"

    # avatar = CloudinaryField('avatar', null=True)
    avatar = models.ImageField(upload_to='avatars/%Y/%m', null=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_verified = models.BooleanField(default=False)  # Admin duyệt Provider tại đây

    def save(self, *args, **kwargs):
        # Nếu là Admin thì auto verified
        if self.is_superuser:
            self.role = self.Role.ADMIN
            self.is_verified = True
        super().save(*args, **kwargs)


class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)  # Phục vụ thống kê doanh thu theo tháng/quý
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(BaseModel):
    # Phân loại: Tour du lịch, Khách sạn, Vé máy bay...
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class TravelService(BaseModel):
    """
    Bảng Dịch vụ (Tour/Khách sạn/Vé).
    Nhà cung cấp chỉ được tạo khi User.is_verified = True
    """
    name = models.CharField(max_length=255)
    description = RichTextField()  # Mô tả chi tiết (HTML)
    price = models.DecimalField(max_digits=12, decimal_places=0)  # Giá tiền (VND)
    location = models.CharField(max_length=255)  # Địa điểm (phục vụ tìm kiếm)

    start_date = models.DateTimeField()  # Thời gian khởi hành
    duration = models.CharField(max_length=100)  # VD: 3N2Đ

    slots_total = models.IntegerField(default=20)  # Tổng chỗ
    slots_available = models.IntegerField(default=20)  # Chỗ còn trống

    # image = CloudinaryField('image', null=True)
    image = models.ImageField(upload_to='services/%Y/%m', null=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='services')

    def __str__(self):
        return self.name


class Booking(BaseModel):
    """
    Bảng Đặt vé.
    Lưu trữ thông tin thanh toán mở rộng (Tiền mặt, MoMo, ZaloPay...)
    """

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ thanh toán'
        CONFIRMED = 'CONFIRMED', 'Đã xác nhận'  # Sau khi Provider duyệt hoặc thanh toán xong
        CANCELLED = 'CANCELLED', 'Đã hủy'

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Tiền mặt'
        MOMO = 'MOMO', 'Ví MoMo'
        ZALOPAY = 'ZALOPAY', 'ZaloPay'
        STRIPE = 'STRIPE', 'Thẻ quốc tế (Stripe)'

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(TravelService, on_delete=models.CASCADE)

    quantity = models.IntegerField(default=1)  # Số lượng khách
    total_price = models.DecimalField(max_digits=12, decimal_places=0)  # Tổng tiền

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)

    def __str__(self):
        return f"Booking {self.id} - {self.user.username}"


class Rating(BaseModel):
    """
    Phản hồi & Đánh giá.
    Giúp Provider nâng cao chất lượng dịch vụ.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(TravelService, on_delete=models.CASCADE, related_name='ratings')
    rate = models.SmallIntegerField(default=5)  # 1-5 sao
    comment = models.TextField(null=True)
    created_date = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.rate} sao"