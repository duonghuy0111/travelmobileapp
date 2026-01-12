#!/bin/bash

echo "=== Cài đặt thư viện ==="
pip install -r requirements.txt

echo "=== Thực thi migrate cơ sở dữ liệu ==="
python manage.py makemigrations
python manage.py migrate

echo "=== Tạo superuser (Admin) ==="
export DJANGO_SUPERUSER_USERNAME=admin
export DJANGO_SUPERUSER_EMAIL=admin@example.com
export DJANGO_SUPERUSER_PASSWORD=Admin@123

# Lệnh này sẽ bỏ qua nếu admin đã tồn tại
python manage.py createsuperuser --no-input 2>/dev/null || echo "SuperUser admin đã tồn tại hoặc có lỗi!"

echo "=== Chèn dữ liệu mẫu Du Lịch ==="
python manage.py shell <<EOF
from django.utils import timezone
from datetime import timedelta
from travel.models import Category, TravelService, User # Lưu ý: Đổi 'courses' thành tên app của bạn nếu đã đổi

# 1. Tạo một user đóng vai trò Nhà cung cấp (Provider) để đăng bài
provider, created = User.objects.get_or_create(username='saigontourist', email='provider@test.com')
if created:
    provider.set_password('123456')
    provider.first_name = 'Saigon'
    provider.last_name = 'Tourist'
    provider.role = 'PROVIDER' # Đảm bảo model User có field role
    provider.is_verified = True # Đã được duyệt
    provider.save()
    print("Đã tạo tài khoản Nhà cung cấp: saigontourist / 123456")

# 2. Tạo Danh mục (Category)
c1, _ = Category.objects.get_or_create(name='Tour Du lịch')
c2, _ = Category.objects.get_or_create(name='Khách sạn - Resort')
c3, _ = Category.objects.get_or_create(name='Vé Máy bay - Tàu xe')

# Link ảnh mẫu (dùng tạm ảnh trên mạng để demo đẹp)
img_tour = 'https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png'
img_tour = 'https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png'
img_tour = 'https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png'
img_hotel = 'https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png'
img_hotel = 'https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png'
img_hotel = 'https://res.cloudinary.com/dxxwcby8l/image/upload/v1709565062/rohn1l6xtpxedyqgyncs.png'


# 3. Tạo Dịch vụ mẫu (TravelService)
# Lưu ý: Các trường bên dưới phải khớp với models.py bạn đã sửa

# Dịch vụ 1: Tour Phú Quốc
TravelService.objects.create(
    name='Tour Đảo Ngọc Phú Quốc 3N2Đ',
    description='Khám phá bãi Sao, lặn ngắm san hô, tham quan nhà tù Phú Quốc. Bao gồm vé máy bay khứ hồi.',
    price=5500000,
    location='Phú Quốc, Kiên Giang',
    start_date=timezone.now() + timedelta(days=10), # Khởi hành sau 10 ngày
    duration='3 ngày 2 đêm',
    slots_total=20,
    slots_available=20,
    image=img_tour,
    category=c1,
    provider=provider
)

# Dịch vụ 2: Tour Đà Lạt
TravelService.objects.create(
    name='Săn mây Đà Lạt - Thành phố ngàn hoa',
    description='Check-in Cầu Gỗ, Đồi Chè Cầu Đất, Quảng trường Lâm Viên.',
    price=2500000,
    location='Đà Lạt, Lâm Đồng',
    start_date=timezone.now() + timedelta(days=5),
    duration='2 ngày 1 đêm',
    slots_total=30,
    slots_available=28,
    image=img_tour,
    category=c1,
    provider=provider
)

# Dịch vụ 3: Tour Sapa
TravelService.objects.create(
    name='Chinh phục đỉnh Fansipan - Sapa',
    description='Trải nghiệm cáp treo, thăm bản Cát Cát, thưởng thức lẩu cá tầm.',
    price=3200000,
    location='Sapa, Lào Cai',
    start_date=timezone.now() + timedelta(days=15),
    duration='3 ngày 2 đêm',
    slots_total=15,
    slots_available=10,
    image=img_tour,
    category=c1,
    provider=provider
)

# Dịch vụ 4: Khách sạn Mường Thanh
TravelService.objects.create(
    name='Khách sạn Mường Thanh Luxury',
    description='Phòng Deluxe view biển, bao gồm buffet sáng.',
    price=1200000,
    location='Nha Trang, Khánh Hòa',
    start_date=timezone.now() + timedelta(days=2),
    duration='1 đêm',
    slots_total=50,
    slots_available=50,
    image=img_hotel,
    category=c2,
    provider=provider
)

# Dịch vụ 5: Xe Limousine
TravelService.objects.create(
    name='Vé xe Limousine Sài Gòn - Vũng Tàu',
    description='Xe 9 chỗ massage, đưa đón tận nơi.',
    price=180000,
    location='Vũng Tàu',
    start_date=timezone.now() + timedelta(days=1),
    duration='2 giờ',
    slots_total=9,
    slots_available=5,
    image=img_hotel,
    category=c3,
    provider=provider
)

print("=== Đã khởi tạo dữ liệu Du lịch thành công! ===")
EOF

echo "=== Chạy server Django ==="
python manage.py runserver