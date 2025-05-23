from django.urls import path
from .views import (
    ProductListCreateAPIView, ProductRetrieveUpdateDestroyAPIView,
    SaleListCreateAPIView, SaleRetrieveAPIView,
    UserListAPIView, SaleItemListAPIView
)

urlpatterns = [
    path('products/', ProductListCreateAPIView.as_view(), name='product-list-create'),
    path('products/<uuid:pk>/', ProductRetrieveUpdateDestroyAPIView.as_view(), name='product-detail'),
    path('sales/', SaleListCreateAPIView.as_view(), name='sale-list-create'),
    path('sales/<uuid:pk>/', SaleRetrieveAPIView.as_view(), name='sale-detail'),
    path('users/', UserListAPIView.as_view(), name='user-list'),
    path('sale-items/', SaleItemListAPIView.as_view(), name='saleitem-list'),
]
