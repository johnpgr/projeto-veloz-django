# Generated by Django 5.2 on 2025-04-19 20:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('src', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='cover_image',
            field=models.ImageField(blank=True, null=True, upload_to='product_covers/'),
        ),
    ]
