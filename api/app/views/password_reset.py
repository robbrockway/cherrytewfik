from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser

from . import ActivationViewMixin
from ..models import PasswordReset, EmptyPasswordError
from ..serializers import *
from ..permissions import *



class PasswordResetViewCommon:

	queryset = PasswordReset.objects.all()
	serializer_class = PasswordResetSerializer



class PasswordResetListView(
	PasswordResetViewCommon,
	generics.ListCreateAPIView,
):
	
	permission_classes = (PasswordResetListPermissions,)



class PasswordResetDetailView(
	PasswordResetViewCommon,
	ActivationViewMixin,
	generics.RetrieveUpdateDestroyAPIView,
):

	permission_classes = (ActivateOnly,)


	def _activation_response(self, request):
		object = self.get_object()

		if 'new_password' in request.data:
			self._try_password_reset(request)
		else:
			key = request.data['activation_key']
			object.try_activation(key)

		return Response('')


	def _try_password_reset(self, request):
		object = self.get_object()

		try:
			object.try_password_reset(
				request.data['activation_key'],
				request.data['new_password'],
			)
		except EmptyPasswordError:
			raise ValidationError('No password')