from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import PermissionDenied

from . import ActivationViewMixin
from ..models import EmailChange, EmailTakenError
from ..serializers import UserSerializer, EmailChangeSerializer
from ..permissions import *



class EmailChangeViewCommon:
	queryset = EmailChange.objects.all()
	serializer_class = EmailChangeSerializer



class EmailChangeListView(
	EmailChangeViewCommon, 
	generics.ListCreateAPIView,
):

	permission_classes = (OwnerCreateOnly,)



class EmailChangeDetailView(
	EmailChangeViewCommon, 
	ActivationViewMixin,
	generics.RetrieveUpdateDestroyAPIView,
):

	activation_serializer_class = UserSerializer
	permission_classes = (ActivateOnlyExceptByOwner,)


	def _activation_response(self, request):
		try:
			return super()._activation_response(request)
		except EmailTakenError:
			raise PermissionDenied('Email address is already taken')
