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
        """Obtem produtos com sua estatisticas de venda e filtros opcionais"""
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
        """Obtem apenas produtos ativos com estoque disponível"""
        return Product.objects.filter(is_active=True, stock__gt=0)

class SaleAnalyticsService:
    @staticmethod
    def get_sales_by_date_range(start_date: datetime) -> QuerySet[Sale]:
        """Obtem vendas filtrada por um range de data"""
        return Sale.objects.filter(
            sale_date__gte=start_date
        ).order_by('-sale_date')

    @staticmethod
    def group_sales_by_user_and_month(sales: QuerySet[Sale]) -> List[Dict[str, Any]]:
        """Agrupa vendas por usuario e mes"""
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
    def group_sales_by_month_and_user(sales: QuerySet[Sale]) -> List[Dict[str, Any]]:
        """Group sales by month and then by user with totals"""
        grouped: Dict[Tuple[int, int], Dict[User, List[Sale]]] = defaultdict(lambda: defaultdict(list))
        totals: Dict[Tuple[int, int], Dict[User, Decimal]] = defaultdict(lambda: defaultdict(Decimal))

        for sale in sales:
            year = sale.sale_date.year
            month = sale.sale_date.month
            user = sale.user
            grouped[(year, month)][user].append(sale)
            totals[(year, month)][user] += sale.total_price

        return SaleAnalyticsService._format_grouped_sales_by_month(grouped, totals)

    @staticmethod
    def _format_grouped_sales(
        grouped: Dict[User, Dict[Tuple[int, int], List[Sale]]],
        totals: Dict[User, Dict[Tuple[int, int], Decimal]]
    ) -> List[Dict[str, Any]]:
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

    @staticmethod
    def _format_grouped_sales_by_month(
        grouped: Dict[Tuple[int, int], Dict[User, List[Sale]]],
        totals: Dict[Tuple[int, int], Dict[User, Decimal]]
    ) -> List[Dict[str, Any]]:
        """Format grouped sales data for template rendering"""
        formatted_sales = []
        for (year, month), user_sales_map in sorted(grouped.items(), key=lambda item: item[0], reverse=True):
            month_data = {
                'year': year,
                'month': month,
                'month_name': gettext(str(month_name[month])),
                'user_sales': []
            }
            for user, sales_list in sorted(user_sales_map.items(), key=lambda item: item[0].username):
                month_data['user_sales'].append({
                    'user': user,
                    'sales': sales_list,
                    'total': totals[(year, month)][user]
                })
            formatted_sales.append(month_data)
        return formatted_sales
