from django.test import TestCase
from django.core import urlresolvers
from django.contrib.auth.models import User

from rest_framework.test import APIClient
from rest_framework import status

from app.models import EmailChange
from .modeltest_base import logged_in
from .. import TestWithUsers, LoginDetails


class UserViewTest(
	TestWithUsers,
	TestCase,
):

	NEW_USER_DETAILS = {
		'username': 'newuser',
		'password': 'passymcwordface',
	}

	CHANGED_NAME_DATA = {
		'first_name': 'Changey',
		'last_name': 'McChangeface',
	}

	# for resolving URLs, in place of a specific User object
	OWN_ACCOUNT = -1  

	INITIAL_EMAIL_ADDRESS = 'initial@email.com'
	CHANGED_EMAIL_ADDRESS = 'changed@email.com'


	def setUp(self):
		super().setUp()
		self._client = APIClient()


	def test_cant_create_user_as_nonstaff(self):
		response = self._request_create_user_with_email(
			'possiblytherob@gmail.com',
			creation_login_details=LoginDetails.NONSTAFF,
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def _request_create_user_with_email(
		self,
		email,
		creation_login_details=LoginDetails.STAFF,
	):
		post_data = dict(
			self.NEW_USER_DETAILS,
			email=email,
		)
		
		if creation_login_details:
			self._client.login(**creation_login_details)

		response = self._client.post(
			urlresolvers.reverse('user_list'),
			post_data,
			'json',
		)

		if creation_login_details:
			self._client.logout()

		return response


	def test_cant_create_user_without_email(self):
		response = self._request_create_user_with_email(None)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_create_user_with_invalid_email(self):
		response = self._request_create_user_with_email(
			email='sdfosfjosdjf',
		)

		self.assertContains(
			response,
			'Enter a valid email',
			status_code=status.HTTP_400_BAD_REQUEST,
		)


	def test_can_list_users_as_staff(self):
		response = self._request_user_list(
			LoginDetails.STAFF,
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)

		users = User.objects.all()
		for user in users:
			self.assertContains(
				response,
				user.username,
			)


	@logged_in
	def _request_user_list(self):
		return self._client.get(
			urlresolvers.reverse('user_list'),
		)


	def test_cant_list_users_as_nonstaff(self):
		response = self._request_user_list(
			LoginDetails.NONSTAFF,
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_can_view_own_profile_as_nonstaff(self):
		response = self._request_user_detail(
			LoginDetails.NONSTAFF,
			self.OWN_ACCOUNT,
		)

		self.assertContains(
			response,
			self._nonstaff_user.username,
			status_code=status.HTTP_200_OK,
		)


	@logged_in
	def _request_user_detail(self, user):
		return self._client.get(
			self._get_user_url(user),
		)


	def _get_user_url(self, user):
		url_pk = 'self' if user == self.OWN_ACCOUNT else user.id
		
		return urlresolvers.reverse(
			'user_detail',
			kwargs={'pk': url_pk},
		)


	def test_can_view_other_profile_as_staff(self):
		response = self._request_user_detail(
			LoginDetails.STAFF,
			self._nonstaff_user,
		)

		self.assertContains(
			response,
			self._nonstaff_user.username,
			status_code=status.HTTP_200_OK,
		)


	def test_cant_view_other_profile_as_nonstaff(self):
		response = self._request_user_detail(
			LoginDetails.NONSTAFF,
			self._staff_user,
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_can_delete_own_account_as_nonstaff(self):
		response = self._request_delete_user(
			LoginDetails.NONSTAFF,
			self.OWN_ACCOUNT,
		)

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


	@logged_in
	def _request_delete_user(self, user):
		return self._client.delete(
			self._get_user_url(user),
			data=None,
			format='json',
		)


	def test_cant_delete_other_account_as_nonstaff(self):
		response = self._request_delete_user(
			LoginDetails.NONSTAFF,
			self._staff_user,
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_can_update_own_name_as_nonstaff(self):
		response = self._request_partially_update_user(
			LoginDetails.NONSTAFF,
			self.OWN_ACCOUNT,
			self.CHANGED_NAME_DATA,
		)

		for string in self.CHANGED_NAME_DATA.values():
			self.assertContains(
				response,
				string,
				status_code=status.HTTP_200_OK,
			)


	@logged_in
	def _request_partially_update_user(self, user, update_dict):
		return self._client.patch(
			self._get_user_url(user),
			update_dict,
			format='json',
		)


	def test_cant_update_other_name_as_nonstaff(self):
		response = self._request_partially_update_user(
			LoginDetails.NONSTAFF,
			self._staff_user,
			self.CHANGED_NAME_DATA,
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_updating_email_produces_email_change_object(self):
		self._response = self._request_email_change(
			LoginDetails.NONSTAFF,
			user_to_change=self._nonstaff_user,
		)

		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._check_response_for_email_change()


	def _request_email_change(self, login_details, user_to_change):
		user_to_change.email = self.INITIAL_EMAIL_ADDRESS
		user_to_change.save()

		return self._request_partially_update_user(
			login_details=login_details,
			user=user_to_change,
			update_dict={'email': self.CHANGED_EMAIL_ADDRESS},
		)


	def _check_response_for_email_change(self):
		# User's email field should be unchanged
		self.assertEqual(self._response.data['email'], self.INITIAL_EMAIL_ADDRESS)

		# and the change should exist as an EmailChange object
		email_change = self._response.data['email_change']
		self.assertTrue(email_change)
		self.assertTrue('new_email' in email_change)
		self.assertEqual(email_change['new_email'], self.CHANGED_EMAIL_ADDRESS)


	def test_cant_change_other_users_email_as_nonstaff(self):
		response = self._request_email_change(
			LoginDetails.NONSTAFF,
			user_to_change=self._staff_user,
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
