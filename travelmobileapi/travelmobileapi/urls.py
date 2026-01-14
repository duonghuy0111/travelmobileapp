from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Cấu hình thông tin cho trang tài liệu Swagger
schema_view = get_schema_view(
    openapi.Info(
        title="Travel Booking API",
        default_version='v1',
        description="Hệ thống API đặt vé du lịch",
        contact=openapi.Contact(email="admin@travel.com"),
        license=openapi.License(name="Dương Hữu Thành License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # 1. Trang quản trị Admin
    path('admin/', admin.site.urls),

    # 2. Cổng chính vào API của app Travel
    path('', include('travel.urls')),

    # 3. Cổng OAuth2 (Dùng để đăng nhập Facebook/Google sau này)
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider')),

    # 4. Trình soạn thảo văn bản CKEditor
    re_path(r'^ckeditor/', include('ckeditor_uploader.urls')),

    # 5. Tài liệu API (Swagger) - Điểm cộng lớn
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Cấu hình để hiển thị ảnh khi chạy ở chế độ Debug (Localhost)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


