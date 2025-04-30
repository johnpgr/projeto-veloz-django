from django.urls import path
from django.urls import path, include
from .views import *

urlpatterns = [
    path('products/', ProductListView.as_view(), name='product-list'),
    path('products/create/', ProductCreateView.as_view(), name='product-create'),
    path('products/<uuid:pk>/update/', ProductUpdateView.as_view(), name='product-update'),
    path('products/<uuid:pk>/delete/', ProductDeleteView.as_view(), name='product-delete'),
    path('sales/', SaleListView.as_view(), name='sale-list'),
    path('sales/create/', SaleCreateView.as_view(), name='sale-create'),
    path('sales/add-item-form/', SaleItemFormView, name='add-sale-item-form'),
    path('accounts/', include('django.contrib.auth.urls')),
    path('accounts/signup/', SignupView, name='signup'),
]
