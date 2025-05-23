from rest_framework import generics, permissions
from .serializers import ProductSerializer, SaleSerializer, UserSerializer, SaleItemSerializer
from .models import Product, Sale, User, SaleItem

class ProductListCreateAPIView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProductRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

class SaleListCreateAPIView(generics.ListCreateAPIView):
    queryset = Sale.objects.all().order_by('-sale_date')
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SaleRetrieveAPIView(generics.RetrieveAPIView):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

class UserListAPIView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class SaleItemListAPIView(generics.ListAPIView):
    queryset = SaleItem.objects.all()
    serializer_class = SaleItemSerializer
    permission_classes = [permissions.IsAuthenticated]
