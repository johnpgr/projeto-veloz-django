from django.shortcuts import redirect, render
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy
from django.utils import log
from django.views.generic import DeleteView, ListView, CreateView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from .forms import *
from .models import *

# Add this new view function
def IndexRedirectView(request):
    if request.user.is_authenticated:
        return redirect('product-list')
    else:
        return redirect('login')

# Product Views
class ProductListView(LoginRequiredMixin, ListView):
    model = Product
    template_name = 'product_list.html'
    context_object_name = 'products'
    paginate_by = 10

    def get_paginate_by(self, queryset):
        return self.request.GET.get('per_page', 10)

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(
            total_revenue=models.Sum(models.F('sales__quantity') * models.F('price'),
                                default=0),
            total_sold=models.Sum('sales__quantity', default=0),
        )

        search_term = self.request.GET.get('search', None)
        if search_term:
            # Using icontains for simple case-insensitive search
            # For true fuzzy search, consider libraries like django-fuzzywuzzy or pg_trgm
            queryset = queryset.filter(name__icontains=search_term)

        ordering = self.request.GET.get('ordering', None)
        if ordering:
            queryset = queryset.order_by(ordering)
        return queryset

    def render_to_response(self, context, **response_kwargs):
        is_htmx_search = (
            self.request.headers.get('HX-Request') == 'true' and
            self.request.headers.get('HX-Trigger') == 'product-search-input'
        )
        if is_htmx_search:
            self.template_name = 'partials/product_list_table.html'
        else:
            self.template_name = 'product_list.html'
        return super().render_to_response(context, **response_kwargs)

class ProductCreateView(LoginRequiredMixin, CreateView):
    model = Product
    form_class = ProductForm
    template_name = 'product_form.html'
    success_url = reverse_lazy('product-list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_create'] = True
        return context

class ProductUpdateView(LoginRequiredMixin, UpdateView):
    model = Product
    form_class = ProductForm
    template_name = 'product_form.html'
    success_url = reverse_lazy('product-list')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_create'] = False
        return context

class ProductDeleteView(LoginRequiredMixin, DeleteView):
    model = Product
    template_name = 'product_confirm_delete.html'
    success_url = reverse_lazy('product-list')

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        context = self.get_context_data(object=self.object)
        if request.headers.get('HX-Request'):
            return self.render_to_response(context)
        return HttpResponseRedirect(self.success_url)

    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.delete()
        return HttpResponseRedirect(self.get_success_url())

# Sale Views
class SaleListView(LoginRequiredMixin, ListView):
    model = Sale
    template_name = 'sale_list.html'
    context_object_name = 'sales'

class SaleCreateView(LoginRequiredMixin, CreateView):
    model = Sale
    form_class = SaleForm
    template_name = 'sale_form.html'
    success_url = reverse_lazy('sale-list')

    def form_valid(self, form: SaleForm):
        sale = form.save(commit=False)
        product = sale.product
        if product.stock >= sale.quantity:
            product.stock -= sale.quantity
            product.save()
            return super().form_valid(form)
        form.add_error('quantity', 'Quantia excede o estoque disponível.')
        return self.form_invalid(form)

def SignupView(request):
    if request.method == 'POST':
        form = UserSignupForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f'Account created for {username}! You can now log in.')
            return redirect('login')
    else:
        form = UserSignupForm()
    return render(request, 'registration/signup.html', {'form': form})
