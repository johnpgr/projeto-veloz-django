from rest_framework import serializers
from .models import Product, Sale, SaleItem, User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'sku', 'stock',
            'created_at', 'updated_at', 'is_active', 'cover_image'
        ]

class SaleItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )

    class Meta:
        model = SaleItem
        fields = ['id', 'product', 'product_id', 'quantity']

class SaleSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'user', 'sale_date', 'items', 'total_price']
