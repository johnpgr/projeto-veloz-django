from typing import Dict, List, Tuple, Any, Optional
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.postgres.search import TrigramSimilarity
from django.db import models
from django.db.models import QuerySet
from datetime import datetime
from collections import defaultdict
from django.utils.translation import gettext
from calendar import month_name
from decimal import Decimal
from .models import Sale, Product, User, SaleItem

class SaleService:
    @staticmethod
    def create_sale(user: User, items: list[SaleItem]) -> Sale:
        """
        Cria uma venda com os itens fornecidos e valida a disponibilidade de estoque
        
        Args:
            user: O usuário que está criando a venda
            items: Lista de instâncias de SaleItem (ainda não salvas)
            
        Returns:
            Sale: A instância da venda criada
            
        Raises:
            ValidationError: Se houver estoque insuficiente para qualquer produto
        """
        with transaction.atomic():
            sale = Sale.objects.create(user=user)
            
            for item in items:
                product = Product.objects.select_for_update().get(id=item.product.pk)
                
                if item.quantity > product.stock:
                    raise ValidationError(
                        f"Estoque insuficiente para {product.name} "
                        f"(disponível: {product.stock})"
                    )
                
                item.sale = sale
                item.save()
                
                product.stock -= item.quantity
                product.save()
                
            return sale

class ProductService:
    @staticmethod
    def get_products_with_stats(
        search_term: Optional[str] = None,
        ordering: Optional[str] = None
    ) -> QuerySet[Product]:
        """Get products with sales statistics and optional filtering"""
        queryset = Product.objects.annotate(
            total_revenue=models.Sum(
                models.F('saleitem__quantity') * models.F('price'),
                default=0
            ),
            total_sold=models.Sum('saleitem__quantity', default=0),
        )

        if search_term:
            queryset = queryset.annotate(
                similarity=TrigramSimilarity('name', search_term)
            ).filter(similarity__gt=0.1).order_by('-similarity')

        if ordering:
            queryset = queryset.order_by(ordering)

        return queryset

    @staticmethod
    def get_active_products_in_stock() -> QuerySet[Product]:
        """Get only active products with stock available"""
        return Product.objects.filter(is_active=True, stock__gt=0)

class SaleAnalyticsService:
    @staticmethod
    def get_sales_by_date_range(start_date: datetime) -> QuerySet[Sale]:
        """Get sales filtered by date range"""
        return Sale.objects.filter(
            sale_date__gte=start_date
        ).order_by('-sale_date')

    @staticmethod
    def group_sales_by_user_and_month(sales: QuerySet[Sale]) -> List[Dict[str, Any]]:
        """Group sales by user and month with totals"""
        grouped: Dict[User, Dict[Tuple[int, int], List[Sale]]] = defaultdict(lambda: defaultdict(list))
        totals: Dict[User, Dict[Tuple[int, int], Decimal]] = defaultdict(lambda: defaultdict(Decimal))

        for sale in sales:
            year = sale.sale_date.year
            month = sale.sale_date.month
            user = sale.user
            grouped[user][(year, month)].append(sale)
            totals[user][(year, month)] += sale.total_price

        return SaleAnalyticsService._format_grouped_sales(grouped, totals)

    @staticmethod
    def _format_grouped_sales(
        grouped: Dict[User, Dict[Tuple[int, int], List[Sale]]],
        totals: Dict[User, Dict[Tuple[int, int], Decimal]]
    ) -> List[Dict[str, Any]]:
        """Format grouped sales data for template rendering"""
        grouped_sales = []
        for user in grouped:
            user_months = []
            for (year, month) in sorted(grouped[user], reverse=True):
                user_months.append({
                    'year': year,
                    'month': month,
                    'month_name': gettext(str(month_name[month])),
                    'sales': grouped[user][(year, month)],
                    'total': totals[user][(year, month)],
                })
            grouped_sales.append({
                'user': user,
                'months': user_months,
            })
        return grouped_sales