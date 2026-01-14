from rest_framework import permissions

class IsProvider(permissions.BasePermission):
    """
    Chỉ cho phép Nhà cung cấp đã được duyệt (is_verified=True) thao tác
    """
    def has_permission(self, request, view):
        return (request.user.is_authenticated and
                request.user.role == 'PROVIDER' and
                request.user.is_verified)

class IsOwner(permissions.IsAuthenticated):
    """
    Chỉ chủ sở hữu (người tạo ra object) mới được sửa/xóa
    """
    def has_object_permission(self, request, view, obj):
        return super().has_permission(request, view) and request.user == obj.user

