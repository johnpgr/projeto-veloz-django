from django.db import transaction
from django.shortcuts import redirect, render
from django.http import HttpResponse,HttpResponseRedirect
from django.contrib.postgres.search import TrigramSimilarity
from django.urls import reverse_lazy
from django.views.generic import DeleteView, ListView, CreateView, UpdateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
from django.forms import modelform_factory
from django.utils.translation import gettext
from .forms import *
from .models import *
import calendar

def IndexRedirectView(request):
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
        val = self.request.GET.get('per_page', 10)
        try:
            val = int(val)
        except (ValueError, TypeError):
            val = 10
        return val


    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(
            total_revenue=models.Sum(models.F('saleitem__quantity') * models.F('price'), default=0),
            total_sold=models.Sum('saleitem__quantity', default=0),
        )

        search_term = self.request.GET.get('search', None)
        if search_term:
            queryset = queryset.annotate(
                similarity=TrigramSimilarity('name', search_term)
            ).filter(similarity__gt=0.1).order_by('-similarity')

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
        '7d': ('Últimos 7 dias', timedelta(days=7)),
        '3d': ('Últimos 3 dias', timedelta(days=3)),
        '14d': ('Últimos 14 dias', timedelta(days=14)),
        '30d': ('Últimos 30 dias', timedelta(days=30)),
        '3m': ('Últimos 3 meses', timedelta(days=90)),
        '12m': ('Último 12 meses', timedelta(days=365)),
    }

    def get_queryset(self):
        queryset = super().get_queryset()
        selected_range_key = self.request.GET.get('range', '7d')

        if selected_range_key in self.range_options:
            _, delta = self.range_options[selected_range_key]
            start_date = timezone.now() - delta
            queryset = queryset.filter(sale_date__gte=start_date)

        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['range_options'] = {k: v[0] for k, v in self.range_options.items()}
        context['selected_range'] = self.request.GET.get('range', '7d')

        sales = context['sales']
        grouped = defaultdict(lambda: defaultdict(list))
        totals = defaultdict(lambda: defaultdict(int))

        for sale in sales:
            year = sale.sale_date.year
            month = sale.sale_date.month
            user = sale.user
            sale.total_price = sum(item.quantity * item.product.price for item in sale.items.all())
            grouped[user][(year, month)].append(sale)
            totals[user][(year, month)] += sale.total_price

        grouped_sales = []
        for user in grouped:
            user_months = []
            for (year, month) in sorted(grouped[user], reverse=True):
                user_months.append({
                    'year': year,
                    'month': month,
                    'month_name': gettext(str(calendar.month_name[month])),
                    'sales': grouped[user][(year, month)],
                    'total': totals[user][(year, month)],
                })
            grouped_sales.append({
                'user': user,
                'months': user_months,
            })

        context['grouped_sales'] = grouped_sales
        return context

class SaleCreateView(LoginRequiredMixin, CreateView):
    model = Sale
    template_name = 'sale_form.html'
    success_url = reverse_lazy('sale-list')

    def get(self, request, *args, **kwargs):
        sale_form = modelform_factory(Sale, fields=[])()
        formset = SaleItemFormSet()
        product_list = Product.objects.filter(is_active=True, stock__gt=0)
        return render(request, self.template_name, {
            'sale_form': sale_form,
            'formset': formset,
            'product_list': product_list,
        })

    def post(self, request, *args, **kwargs):
        sale_form = modelform_factory(Sale, fields=[])(
            request.POST
        )
        formset = SaleItemFormSet(request.POST)
        product_list = Product.objects.filter(is_active=True, stock__gt=0)
        if formset.is_valid():
            with transaction.atomic():
                sale = Sale.objects.create(user=request.user)
                items = formset.save(commit=False)
                for item in items:
                    product = item.product
                    if item.quantity > product.stock:
                        formset.errors[items.index(item)]['quantity'] = [
                            f"Estoque insuficiente para {product.name} (disponível: {product.stock})"
                        ]
                        transaction.set_rollback(True)
                        messages.error(request, f"Estoque insuficiente para {product.name}.")
                        return render(request, self.template_name, {
                            'sale_form': sale_form,
                            'formset': formset,
                            'product_list': product_list,
                        })
                    item.sale = sale
                    item.save()
                    product.stock -= item.quantity
                    product.save()
                return redirect(self.success_url)
        return render(request, self.template_name, {
            'sale_form': sale_form,
            'formset': formset,
            'product_list': product_list,
        })

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
