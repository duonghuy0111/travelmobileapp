from django.contrib import admin
from django.utils.safestring import mark_safe
from travel.models import Category, TravelService, Booking, User, Rating

class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'role', 'is_verified', 'email', 'date_joined']
    list_filter = ['role', 'is_verified']
    actions = ['approve_provider']

    def approve_provider(self, request, queryset):
        queryset.update(is_verified=True)
    approve_provider.short_description = "Duyệt Nhà cung cấp đã chọn"

class TravelServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'provider', 'price', 'slots_available', 'active']
    search_fields = ['name', 'location']
    list_filter = ['category', 'start_date']
    readonly_fields = ['img_view']

    def img_view(self, obj):
        if obj.image:
            return mark_safe(f"<img src='{obj.image.url}' width='100' />")

class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'service', 'total_price', 'status', 'payment_method', 'created_date']
    list_filter = ['status', 'payment_method']

admin.site.register(User, UserAdmin)
admin.site.register(Category)
admin.site.register(TravelService, TravelServiceAdmin)
admin.site.register(Booking, BookingAdmin)
admin.site.register(Rating)


