from django import forms

from .models import Product, Sale

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'sku', 'stock', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'input input-bordered w-full'}),
            'description': forms.Textarea(attrs={
                'class': 'textarea textarea-bordered w-full',
                'rows': 3
            }),
            'price': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'sku': forms.TextInput(attrs={'class': 'input input-bordered w-full'}),
            'stock': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'toggle toggle-primary'}),
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
        widgets = {
            'product': forms.Select(attrs={'class': 'select select-bordered w-full'}),
            'quantity': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
        }
        labels = {
            'product': 'Produto',
            'quantity': 'Quantidade',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['product'].queryset = Product.objects.filter(is_active=True)
