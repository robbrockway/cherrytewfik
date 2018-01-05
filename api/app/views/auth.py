from django.contrib.auth import login, logout
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import status

from ..serializers import UserSerializer



class LoginView(APIView):
	'''
	Takes an email address instead of a username.
	'''

	def post(self, request, *args, **kwargs):
		user = self._authenticate_user(request)

		login(request, user)

		serializer = UserSerializer(user)
		return Response(serializer.data)


	def _authenticate_user(self, request):
		self._check_credentials_are_present(request)

		try:
			user = User.objects.get(email=request.data['email'])
		except User.DoesNotExist:
			raise AuthenticationFailed('No user exists with that email address')

		if not check_password(request.data['password'], user.password):
			raise AuthenticationFailed('Invalid password')

		return user


	def _check_credentials_are_present(self, request):
		for field in ('email', 'password'):
			if field not in request.data:
				raise AuthenticationFailed('No %s' % field)



class LogoutView(APIView):
	'''
	Returns an empty 'OK' response rather than redirecting to an allotted page like the built-in logout view.
	'''

	def post(self, request, *args, **kwargs):
		logout(request)

		return Response(status=status.HTTP_200_OK)