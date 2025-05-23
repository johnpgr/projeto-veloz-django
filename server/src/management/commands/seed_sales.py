from django.core.management.base import BaseCommand
from src.models import Sale, Product, SaleItem, User
from faker import Faker
from django.utils import timezone
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Seeds the database with sample sales data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Number of sales to create'
        )

    def handle(self, *args, **kwargs):
        fake = Faker()
        count = kwargs['count']

        # Fetch available user and product IDs efficiently
        user_ids = list(User.objects.values_list('id', flat=True))
        product_ids = list(Product.objects.values_list('id', flat=True))

        if not user_ids:
            self.stdout.write(self.style.ERROR('No users found in the database. Please seed users first.'))
            return

        if not product_ids:
            self.stdout.write(self.style.ERROR('No products found in the database. Please seed products first.'))
            return

        user_id = random.choice(user_ids)
        product_id = random.choice(product_ids)
        quantity = random.randint(1, 5) # Random quantity between 1 and 5
        # Generate a random date within the last year
        end_date = timezone.now()
        start_date = end_date - timedelta(days=365)

        sales_to_create = []
        saleitems_to_create = []
        for _ in range(count):
            user_id = random.choice(user_ids)
            random_date = fake.date_time_between(
                start_date=start_date, end_date=end_date, tzinfo=timezone.get_current_timezone()
            )
            sale = Sale(
                user_id=user_id,
                sale_date=random_date,
            )
            sales_to_create.append(sale)

        # Bulk create sales to get their IDs
        Sale.objects.bulk_create(sales_to_create)
        created_sales = Sale.objects.filter(
            user_id__in=user_ids, sale_date__gte=start_date, sale_date__lte=end_date
        ).order_by('-sale_date')[:count]

        for sale in created_sales:
            # Each sale will have 1-3 items
            num_items = random.randint(1, 3)
            chosen_products = random.sample(product_ids, min(num_items, len(product_ids)))
            for product_id in chosen_products:
                quantity = random.randint(1, 5)
                saleitems_to_create.append(
                    SaleItem(
                        sale=sale,
                        product_id=product_id,
                        quantity=quantity,
                    )
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created: Sale {sale.id} for User ID {sale.user_id}, Product ID {product_id}, Quantity {quantity}'
                    )
                )

        try:
            SaleItem.objects.bulk_create(saleitems_to_create)
            self.stdout.write(
                self.style.SUCCESS(f'\nSuccessfully processed {count} sales with items')
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating sales: {e}'))
