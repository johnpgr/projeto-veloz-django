from django.urls import path
from django.urls import path
from . import views

urlpatterns = [
    # Product URLs
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/create/', views.ProductCreateView.as_view(), name='product-create'),
    path('products/<uuid:pk>/update/', views.ProductUpdateView.as_view(), name='product-update'),
    path('products/<uuid:pk>/delete/', views.ProductDeleteView.as_view(), name='product-delete'),
    
    # Sale URLs
    path('sales/', views.SaleListView.as_view(), name='sale-list'),
    path('sales/create/', views.SaleCreateView.as_view(), name='sale-create'),
]
