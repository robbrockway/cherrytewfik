# Provides an X-CSRFToken header in responses to all requests that come from an accepted origin

from django.middleware import csrf
from django_config.settings import *



class CorsMiddleware:

	def __init__(self, get_response):
		self._get_response = get_response


	def __call__(self, request):
		response = self._get_response(request)
		
		if self._is_from_accepted_origin(request):
			response['X-CSRFToken'] = self._get_csrf_token(request)

		return response


	def _is_from_accepted_origin(self, request):
		origin = self._get_origin(request)
		return origin in CORS_ALLOWED_HOSTS


	def _get_origin(self, request):
		raw_origin = request.META.get('HTTP_ORIGIN')

		if raw_origin:
			return raw_origin.replace('http://', '')


	def _get_csrf_token(self, request):
		return csrf.get_token(request)