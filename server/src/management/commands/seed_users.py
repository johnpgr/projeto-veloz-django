from django.core.management.base import BaseCommand
from src.models import User
from faker import Faker
from django.db import IntegrityError

class Command(BaseCommand):
    help = 'Seeds the database with sample user data, ensuring an admin user exists.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=5,
            help='Number of random users to create in addition to the admin user'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='admin',
            help='Password for the admin user and default for random users'
        )

    def handle(self, *args, **kwargs):
        fake = Faker()
        count = kwargs['count']
        admin_password = kwargs['password']

        try:
            admin_user, created = User.objects.get_or_create(
                username='admin',
                defaults={'is_staff': True, 'is_superuser': True, 'email': 'admin@example.com'}
            )
            admin_user.set_password(admin_password)
            admin_user.save()
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status} admin user with password "{admin_password}"'))
        except IntegrityError:
            self.stdout.write(self.style.WARNING('Admin user could not be created due to an integrity error (e.g., email conflict).'))


        for i in range(count):
            username = fake.user_name()
            try:
                user, created = User.objects.get_or_create(
                    username=username,
                    defaults={'email': fake.email(), 'first_name': fake.first_name(), 'last_name': fake.last_name()}
                )
                if created:
                    user.set_password(admin_password)
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
                else:
                    self.stdout.write(self.style.NOTICE(f'User {username} already exists.'))
            except IntegrityError:
                self.stdout.write(self.style.WARNING(f'Could not create user {username} due to an integrity error.'))

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully processed users.'))
