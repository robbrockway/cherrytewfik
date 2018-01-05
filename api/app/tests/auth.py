from django.test import TestCase
from django.core import urlresolvers
from django.contrib.auth.models import User

from rest_framework.test import APIClient
from rest_framework import status

from .models.modeltest_base import TestWithUsers, LoginDetails
from . import request_denied


class AuthTest(TestWithUsers, TestCase):

	PATCH_DATA = {
		'first_name': 'Testy',
		'last_name': 'McTestface',
	}


	@classmethod
	def setUpTestData(cls):
		cls.LOGIN_DETAILS = {
			k: v for k, v in cls.NONSTAFF_PROFILE.items()
			if k in ('email', 'password')
		}


	def test_can_login(self):
		response = self._request_login(self.LOGIN_DETAILS)

		self.assertContains(
			response,
			text=self.NONSTAFF_PROFILE['username'],
			status_code=status.HTTP_200_OK,
		)


	def _request_login(self, login_details):
		return self._client.post(
			urlresolvers.reverse('login'),
			login_details,
			format='json',
		)


	def test_can_perform_authenticated_operation_after_login(self):
		self._request_login(self.LOGIN_DETAILS)

		self._try_authenticated_operation(
			expected_status_code=status.HTTP_200_OK,
		)


	def _try_authenticated_operation(self, expected_status_code):
		response = self._request_patch_own_profile()
		self.assertEqual(response.status_code, expected_status_code)


	def _request_patch_own_profile(self):
		url = urlresolvers.reverse(
			'user_detail',
			kwargs={'pk': 'self'},
		)

		return self._client.patch(
			url,
			self.PATCH_DATA,
			format='json',
		)


	def test_cant_login_with_invalid_password(self):
		self._check_cant_login_with(
			dict(self.LOGIN_DETAILS, password='boguspassword'),
		)


	def _check_cant_login_with(self, login_details):
		response = self._request_login(login_details)
		self.assertTrue(request_denied(response))


	def test_cant_login_without_password(self):
		self._check_cant_login_with(
			{'email': self.LOGIN_DETAILS['email']},
		)


	def test_cant_login_with_unregistered_email(self):
		self._check_cant_login_with(
			dict(self.LOGIN_DETAILS, email='unregistered@email.com'),
		)


	def test_cant_login_without_email(self):
		self._check_cant_login_with(
			{'password': self.LOGIN_DETAILS['password']},
		)


	def test_logout_success(self):
		self._request_login(self.LOGIN_DETAILS)
		response = self._request_logout()

		self.assertEqual(response.status_code, status.HTTP_200_OK)


	def _request_logout(self):
		return self._client.post(
			urlresolvers.reverse('logout'),
		)


	def test_cant_perform_authenticated_operation_after_logout(self):
		self._request_login(self.LOGIN_DETAILS)
		self._request_logout()

		self._try_authenticated_operation(
			expected_status_code=status.HTTP_403_FORBIDDEN,
		)
