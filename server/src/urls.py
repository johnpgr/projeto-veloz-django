from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ProductListCreateAPIView, ProductRetrieveUpdateDestroyAPIView,
    SaleListCreateAPIView, SaleRetrieveAPIView,
    UserListAPIView, SaleItemListAPIView,
    CustomTokenObtainPairView, UserRegistrationView, UserProfileView,
    logout_view, user_info_view
)

urlpatterns = [
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token-obtain-pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/register/', UserRegistrationView.as_view(), name='user-register'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/user/', user_info_view, name='user-info'),
    path('auth/profile/', UserProfileView.as_view(), name='user-profile'),
    
    # Existing endpoints
    path('products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('products/<uuid:pk>/', ProductRetrieveUpdateDestroyAPIView.as_view(), name='product-detail'),
    path('sales/', SaleListCreateAPIView.as_view(), name='sale-list-create'),
    path('sales/<uuid:pk>/', SaleRetrieveAPIView.as_view(), name='sale-detail'),
    path('users/', UserListAPIView.as_view(), name='user-list'),
    path('sale-items/', SaleItemListAPIView.as_view(), name='saleitem-list'),
]
