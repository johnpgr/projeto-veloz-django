from django import forms
from django.core.exceptions import ValidationError
from django.contrib.auth.forms import UserCreationForm

from .models import Product, Sale, User, SaleItem

class UserSignupForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User

class CustomClearableFileInput(forms.ClearableFileInput):
    template_name = 'widgets/clearable_file_input.html'

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'sku', 'cover_image', 'stock', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'input input-bordered w-full'}),
            'description': forms.Textarea(attrs={
                'class': 'textarea textarea-bordered w-full',
                'rows': 3
            }),
            'price': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'sku': forms.TextInput(attrs={'class': 'input input-bordered w-full'}),
            'cover_image': CustomClearableFileInput(attrs={'class': 'file-input file-input-bordered w-full'}),
            'stock': forms.NumberInput(attrs={'class': 'input input-bordered w-full'}),
            'is_active': forms.CheckboxInput(attrs={'class': 'toggle toggle-primary'}),
        }
        labels = {
            'name': 'Nome',
            'description': 'Descrição',
            'price': 'Preço',
            'sku': 'SKU',
            'cover_image': 'Imagem',
            'stock': 'Estoque',
            'is_active': 'Ativo',
        }

    def clean_cover_image(self):
        image = self.cleaned_data.get('cover_image', False)
        if image:
            if image.size > 5 * 1024 * 1024: # 5MB limit
                raise ValidationError("A imagem não pode ter mais que 5MB.")
        return image

class SaleItemForm(forms.ModelForm):
    class Meta:
        model = SaleItem
        fields = ['product', 'quantity']
        widgets = {
            'product': forms.Select(attrs={
                'class': 'select select-bordered w-full',
                'x-on:change': 'updateStockLimit($el)'
            }),
            'quantity': forms.NumberInput(attrs={
                'class': 'input input-bordered join-item w-24 text-center',
                'min': '1',
                'x-bind:max': 'stockLimit'
            }),
        }
        labels = {
            'product': 'Produto',
            'quantity': 'Quantidade',
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['product'].queryset = Product.objects.filter(is_active=True, stock__gt=0)

SaleItemFormSet = forms.inlineformset_factory(
    Sale, SaleItem, form=SaleItemForm, extra=1, can_delete=True
)
