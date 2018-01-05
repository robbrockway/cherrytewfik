from django.contrib.auth.models import AnonymousUser

from rest_framework import generics

from ..models import Address
from ..serializers import AddressSerializer
from ..permissions import *
from . import OwnerSensitiveListViewMixin



class AddressViewCommon:

	queryset = Address.objects.all()
	serializer_class = AddressSerializer
	permission_classes = (OwnerCanCreateRetrieveAndDestroy,)



class AddressListView(
	AddressViewCommon,
	OwnerSensitiveListViewMixin,
	generics.ListCreateAPIView,
):
	pass



class AddressDetailView(
	AddressViewCommon,
	generics.RetrieveUpdateDestroyAPIView,
):
	pass