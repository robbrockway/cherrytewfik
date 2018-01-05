from django.middleware import csrf
from django.http import HttpResponse, HttpRequest
from django.test import TestCase

from ..cors_middleware import CorsMiddleware

from django_config.settings import CORS_ALLOWED_HOSTS
from django.middleware.csrf import CsrfViewMiddleware



ALLOWED_ORIGIN = 'allowed.com'
DISALLOWED_ORIGIN = 'disallowed.com'
CSRF_TOKEN_HEADER_NAME = 'X-CSRFToken'


# Callback, passed to middleware
def get_response(request):
	return HttpResponse()



class CorsMiddlewareTest(TestCase):

	def setUp(self):
		CORS_ALLOWED_HOSTS.append(ALLOWED_ORIGIN)	# Overwrite app settings, for testing purposes
		self.middleware = CorsMiddleware(get_response)


	def test_adds_csrf_token_to_response_when_origin_is_allowed(self):
		response = self._get_response(ALLOWED_ORIGIN)
		self._check_response_has_csrf_token_in_header(response)


	# Sends request from 'origin' provided; returns request and response after passing through middleware
	def _get_response(self, request_origin):
		# Make sure HTTP prefix doesn't faze the middleware
		request_origin = 'http://' + request_origin

		request = HttpRequest()
		request.META['HTTP_ORIGIN'] = request_origin
		response = self.middleware(request)

		return response


	def _check_response_has_csrf_token_in_header(self, response):
		self.assertTrue(response.get(CSRF_TOKEN_HEADER_NAME))


	def test_doesnt_add_csrf_token_to_response_when_origin_isnt_allowed(self):
		response = self._get_response(DISALLOWED_ORIGIN)
		self._check_response_doesnt_have_csrf_token_header(response)


	def _check_response_doesnt_have_csrf_token_header(self, response):
		self.assertFalse(CSRF_TOKEN_HEADER_NAME in response)

