from django.db import models
from django.contrib.auth.models import AbstractUser
from ckeditor.fields import RichTextField
from cloudinary.models import CloudinaryField


class User(AbstractUser):

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Quản trị viên"
        PROVIDER = "PROVIDER", "Nhà cung cấp dịch vụ"
        CUSTOMER = "CUSTOMER", "Khách hàng"

    # avatar = CloudinaryField('avatar', null=True)
    avatar = models.ImageField(upload_to='avatars/%Y/%m', null=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    is_verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.role = self.Role.ADMIN
            self.is_verified = True
        super().save(*args, **kwargs)


class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Category(BaseModel):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class TravelService(BaseModel):
    name = models.CharField(max_length=255)
    description = RichTextField()
    price = models.DecimalField(max_digits=12, decimal_places=0)
    location = models.CharField(max_length=255)

    # Sửa: Thêm end_date để hỗ trợ Khách sạn (Check-in/Check-out)
    start_date = models.DateTimeField()  # Tour: Ngày đi | Hotel: Check-in
    end_date = models.DateTimeField(null=True, blank=True)  # Tour: Ngày về | Hotel: Check-out

    duration = models.CharField(max_length=50, null=True, blank=True)  # Ví dụ: "3N2Đ"
    slots_total = models.IntegerField(default=10)
    slots_available = models.IntegerField(default=10)

    image = models.ImageField(upload_to='services/%Y/%m', null=True)  # Hoặc CloudinaryField

    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='services')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='provided_services')

    def __str__(self):
        return self.name

class Booking(BaseModel):

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ thanh toán'
        CONFIRMED = 'CONFIRMED', 'Đã xác nhận'
        CANCELLED = 'CANCELLED', 'Đã hủy'

    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Tiền mặt'
        MOMO = 'MOMO', 'Ví MoMo'
        ZALOPAY = 'ZALOPAY', 'ZaloPay'
        STRIPE = 'STRIPE', 'Thẻ quốc tế (Stripe)'

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(TravelService, on_delete=models.CASCADE)

    quantity = models.IntegerField(default=1)
    total_price = models.DecimalField(max_digits=12, decimal_places=0)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)

    def __str__(self):
        return f"Booking {self.id} - {self.user.username}"


class Rating(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(TravelService, on_delete=models.CASCADE, related_name='ratings')
    rate = models.SmallIntegerField(default=5)  # 1-5 sao
    comment = models.TextField(null=True)
    created_date = models.DateTimeField(auto_now_add=True)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.rate} sao"


class Like(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.ForeignKey(TravelService, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'service')