from django import forms

from .models import Product, Sale

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'sku', 'stock', 'is_active']
        widgets = {
            'description': forms.Textarea(attrs={'rows': 3}),
        }
        labels = {
            'name': 'Nome',
            'description': 'Descrição',
            'price': 'Preço',
            'sku': 'SKU',
            'stock': 'Estoque',
            'is_active': 'Ativo',
        }

class SaleForm(forms.ModelForm):
    class Meta:
        model = Sale
        fields = ['product', 'quantity']
        labels = {
            'product': 'Produto',
            'quantity': 'Quantidade',
        }
