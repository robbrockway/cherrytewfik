import json

from django.http import Http404
from django.contrib.auth.models import User

from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from . import ActivationViewMixin
from ..models import *
from ..serializers import PendingUserSerializer, UserSerializer
from ..permissions import *



class PendingUserViewCommon:

	queryset = PendingUser.objects.all()
	serializer_class = PendingUserSerializer



class PendingUserListView(
	PendingUserViewCommon,
	generics.ListCreateAPIView,
):

	permission_classes = (CreateOnly,)



class PendingUserDetailView(
	PendingUserViewCommon,
	ActivationViewMixin,
	generics.RetrieveUpdateDestroyAPIView,
):

	queryset = PendingUser.objects.all()
	serializer_class = PendingUserSerializer
	activation_serializer_class = UserSerializer
	permission_classes = (ActivateOnly,)


	def _after_activation(self, new_user):
		if self.request.session.session_key:
			for model_class in [Basket, Order, Address]:
				self._transfer_guest_assets_to_new_user(
					new_user,
					model_class,
				)


	def _transfer_guest_assets_to_new_user(self, new_user, model_class):
		queryset = model_class.objects.filter(
			session_key=self.request.session.session_key,
		)

		queryset.update(
			session_key='',
			user=new_user,
		)
