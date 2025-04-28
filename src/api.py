from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.shortcuts import render
import json
from src.models import Product, Sale, SaleItem

@login_required
@require_http_methods(["POST"])
def create_sale_api(request):
    """API endpoint for creating sales from JSON data"""
    try:
        sale_items = json.loads(request.body)
        
        if not sale_items:
            return JsonResponse({'error': 'No items provided'}, status=400)
        
        # Create the sale
        sale = Sale(user=request.user)
        sale.save()
        
        # Create all sale items
        for item in sale_items:
            product_id = item.get('product_id')
            quantity = int(item.get('quantity', 1))
            
            try:
                product = Product.objects.get(id=product_id)
                
                # Validate stock availability
                if product.stock < quantity:
                    sale.delete()  # Roll back the sale creation
                    return JsonResponse({
                        'error': f'Not enough stock for {product.name}. Available: {product.stock}'
                    }, status=400)
                
                # Create sale item
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=quantity
                )
                
                # Update product stock
                product.stock -= quantity
                product.save()
                
            except Product.DoesNotExist:
                sale.delete()  # Roll back the sale creation
                return JsonResponse({'error': f'Product with ID {product_id} not found'}, status=404)
        
        # Redirect to the sales list page
        response = HttpResponse(status=200)
        response['HX-Redirect'] = reverse('sale-list')
        return response
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
