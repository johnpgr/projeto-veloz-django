from django.shortcuts import redirect, render
from django.http import HttpResponseRedirect
from django.urls import reverse_lazy
from django.views.generic import DeleteView, ListView, CreateView, UpdateView, View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
from django.forms import modelform_factory
from .forms import *
from .models import *
from .services import *

class IndexRedirectView(View):
    def get(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('product-list')
        else:
            return redirect('login')

class ProductListView(LoginRequiredMixin, ListView):
    model = Product
    template_name = 'product_list.html'
    context_object_name = 'products'
    paginate_by = 10

    def get_paginate_by(self, queryset):
        return int(self.request.GET.get('per_page', 10) or 10)

    def get_queryset(self):
        search_term = self.request.GET.get('search', None)
        ordering = self.request.GET.get('ordering', None)
        return ProductService.get_products_with_stats(search_term, ordering)

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
        return HttpResponseRedirect(self.get_success_url())

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        success_url = self.get_success_url()
        self.object.delete()
        return HttpResponseRedirect(success_url)

class SaleListView(LoginRequiredMixin, ListView):
    model = Sale
    template_name = 'sale_list.html'
    context_object_name = 'sales'
    ordering = ['-sale_date']

    range_options = {
        '3d': ('Últimos 3 dias', timedelta(days=3)),
        '7d': ('Últimos 7 dias', timedelta(days=7)),
        '14d': ('Últimos 14 dias', timedelta(days=14)),
        '30d': ('Últimos 30 dias', timedelta(days=30)),
        '3m': ('Últimos 3 meses', timedelta(days=90)),
        '12m': ('Último 12 meses', timedelta(days=365)),
    }

    def get_queryset(self):
        selected_range_key = self.request.GET.get('range', '7d')
        if selected_range_key in self.range_options:
            _, delta = self.range_options[selected_range_key]
            start_date = timezone.now() - delta
            return SaleAnalyticsService.get_sales_by_date_range(start_date)
        return Sale.objects.none()

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['range_options'] = {k: v[0] for k, v in self.range_options.items()}
        context['selected_range'] = self.request.GET.get('range', '7d')
        
        sales = context['sales']
        context['grouped_sales'] = SaleAnalyticsService.group_sales_by_user_and_month(sales)
        return context

class SaleCreateView(LoginRequiredMixin, CreateView):
    model = Sale
    template_name = 'sale_form.html'
    success_url = reverse_lazy('sale-list')

    def get(self, request, *args, **kwargs):
        formset = SaleItemFormSet(prefix='items')
        sale_form = modelform_factory(Sale, fields=[])()
        product_list = ProductService.get_active_products_in_stock()
        form = formset.empty_form
        form.prefix = 'items-0'

        assert self.template_name is not None, "Template name is not set"
        return render(request, self.template_name, {
            'form': form,
            'formset': formset,
            'sale_form': sale_form,
            'product_list': product_list,
        })

    def get_product_list(self):
        return Product.objects.filter(is_active=True, stock__gt=0)

    def create_sale_form(self, data=None):
        return modelform_factory(Sale, fields=[])(data)

    def handle_form_errors(self, formset, error_msg, form_index):
        item_form = formset.forms[form_index]
        item_form.add_error('quantity', error_msg)
        messages.error(self.request, error_msg)

    def post(self, request):
        sale_form = self.create_sale_form(request.POST)
        formset = SaleItemFormSet(request.POST)
        items = []
        
        if not formset.is_valid():
            return self.render_form_with_errors(sale_form, formset)

        try:
            items = formset.save(commit=False)
            assert isinstance(request.user, User), "Invalid user type"
            SaleService.create_sale(request.user, items)
            assert self.success_url is not None, "Success URL is not set"
            return redirect(self.success_url)
            
        except ValidationError as e:
            self.handle_form_errors(
                formset, 
                str(e), 
                next(i for i, item in enumerate(items) if item.product.name in str(e))
            )
            return self.render_form_with_errors(sale_form, formset)

    def render_form_with_errors(self, sale_form, formset):
        form = formset.empty_form
        form.prefix = 'items-0'
        assert self.template_name is not None, "Template name is not set"
        return render(
            self.request,
            self.template_name,
            {
                'form': form,
                'sale_form': sale_form,
                'formset': formset,
                'product_list': self.get_product_list(),
            }
        )

class SaleItemFormView(LoginRequiredMixin, View):
    template_name = 'partials/sale_item_form.html'

    def get(self, request, *args, **kwargs):
        product_list = ProductService.get_active_products_in_stock()
        formset = SaleItemFormSet(prefix='items')
        form_index = request.GET.get('next_index', 0)
        form = formset.empty_form
        form.prefix = f'items-{form_index}'

        return render(
            request,
            self.template_name,
            {
                'form': form,
                'formset': formset,
                'can_delete': True,
                'product_list': product_list,
            }
        )

class SignupView(View):
    template_name = 'registration/signup.html'

    def get(self, request, *args, **kwargs):
        form = UserSignupForm()
        return render(request, self.template_name, {'form': form})

    def post(self, request, *args, **kwargs):
        form = UserSignupForm(request.POST)
        if form.is_valid():
            form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f'Account created for {username}! You can now log in.')
            return redirect('login')
        return render(request, self.template_name, {'form': form})
