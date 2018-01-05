from django.test import TestCase
from django.core import urlresolvers

from rest_framework import status
from rest_framework.test import APIClient



class NewClientTokenViewTest(TestCase):

	def setUp(self):
		self._client = APIClient()
		self._response = self._client.post(
			urlresolvers.reverse('new_client_token'),
		)


	def test_get_new_client_token(self):
		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self.assertTrue('braintree_client_token' in self._client.session)
