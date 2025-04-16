from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from uuid_v7 import base as uuid

class Product(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid7,
        editable=False,
        unique=True,
    )
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    sku = models.CharField(max_length=100, unique=True)
    stock = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self) -> str:
        return f"Product {self.name} - SKU: {self.sku}"

class Sale(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid7,
        editable=False,
        unique=True,
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sales')
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    sale_date = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"Sale of {self.product.name} - Qty: {self.quantity}"
