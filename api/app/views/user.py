from django.contrib.auth.models import User, AnonymousUser

from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.exceptions import NotAuthenticated

from ..serializers import UserSerializer
from ..permissions import *
from ..models import EmailChange



class UserViewCommon:

	queryset = User.objects.all()
	serializer_class = UserSerializer



class UserListView(
	UserViewCommon,
	generics.ListCreateAPIView,
):

	permission_classes = (IsAdminUser,)


	def perform_create(self, serializer):
		serializer.save()



class UserDetailView(
	UserViewCommon,
	generics.RetrieveUpdateDestroyAPIView,
):

	queryset = User.objects.all()
	serializer_class = UserSerializer
	permission_classes = (IsOwner,)


	def update(self, request, *args, **kwargs):
		if self._is_authenticated_email_change():
			self._create_email_change_object()

		kwargs['partial'] = True
		return super().update(request, *args, **kwargs)


	def _is_authenticated_email_change(self):
		user = self.get_object()

		return 'email' in self.request.data \
			and self.request.data['email'] != user.email \
			and not self.request.user.is_staff


	def _create_email_change_object(self):
		new_email = self.request.data.pop('email')
		EmailChange.objects.create(
			user=self.get_object(),
			new_email=new_email,
		)


	def get_object(self):
		if self.kwargs['pk'] == 'self':
			return self._get_logged_in_user()

		return super().get_object()


	def _get_logged_in_user(self):
		if isinstance(self.request.user, AnonymousUser):
			raise NotAuthenticated('Must be logged in to view own profile')

		return self.request.user