# from django.urls import path, include
# from rest_framework.routers import DefaultRouter
# from . import views
#
# # Tạo Router để tự động sinh ra các đường dẫn API
# router = DefaultRouter()
# router.register('categories', views.CategoryViewSet)
# router.register('services', views.TravelServiceViewSet)
# router.register('users', views.UserViewSet)
# router.register('bookings', views.BookingViewSet)
#
# urlpatterns = [
#     path('', include(router.urls)),
# ]


from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Tạo Router
router = DefaultRouter()

# THÊM basename='...' VÀO TẤT CẢ CÁC DÒNG ĐỂ TRÁNH LỖI
router.register('categories', views.CategoryViewSet, basename='category')
router.register('services', views.TravelServiceViewSet, basename='travelservice')
router.register('users', views.UserViewSet, basename='user')
router.register('bookings', views.BookingViewSet, basename='booking')
router.register('stats', views.StatsViewSet, basename='stats')

urlpatterns = [
    path('', include(router.urls)),
]