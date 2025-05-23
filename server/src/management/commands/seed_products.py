from django.core.management.base import BaseCommand
from src.models import Product
from decimal import Decimal
from faker import Faker
import random

class Command(BaseCommand):
    help = 'Seeds the database with sample product data using Faker'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Number of products to create'
        )

    def handle(self, *args, **kwargs):
        fake = Faker()
        count = kwargs['count']
        
        categories = ['Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 
                     'Headphones', 'Speaker', 'Webcam', 'Microphone', 'Storage']
        
        for _ in range(count):
            category = random.choice(categories)
            name = f"{fake.company()} {category} {fake.word().title()}"
            rand_letters = ''.join(fake.random_letters(length=3)).upper()
            rand_int = fake.random_int(min=100, max=999)
            
            # SKU format: CAT-XXX-###
            sku = f"{category[:3].upper()}-{rand_letters}-{rand_int}"
            
            product_data = {
                'name': name,
                'description': fake.paragraph(nb_sentences=3),
                'price': Decimal(random.uniform(10.0, 2000.0)).quantize(Decimal('0.01')),
                'sku': sku,
                'stock': fake.random_int(min=0, max=200),
                'is_active': random.choice([True, False])
            }
            
            _, created = Product.objects.get_or_create(
                sku=product_data['sku'],
                defaults=product_data
            )
            
            status = 'Created' if created else 'Already exists'
            self.stdout.write(
                self.style.SUCCESS(f'{status}: {product_data["name"]} (SKU: {product_data["sku"]})')
            )

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully processed {count} products')
        )
