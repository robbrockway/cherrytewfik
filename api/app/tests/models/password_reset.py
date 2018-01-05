from django.test import TestCase
from django.contrib.auth.models import User

from rest_framework.test import APIClient

from app.models import PasswordReset
from .modeltest_base import *



class PasswordResetTestCommon:

	@classmethod
	def _init_params(cls):
		cls.model_class = PasswordReset
		cls.fields = ModelTestFields()


	def _init_user_references(self):
		# User data is specific to each instance of this class, so is created here rather than in _init_params()
		self._init_users()
		self._init_additional_user()

		self.fields.initial['user'] = self._additional_user
		self.fields.changed['user'] = self._nonstaff_user


	def _create_password_reset(self, user=None):
		return PasswordReset.objects.create(
			user=user or self._nonstaff_user,
		)



class PasswordResetTest(
	PasswordResetTestCommon,
	ModelTestBaseWithActivationKey,
	TestWithUsers,
	TestCase,
):

	NEW_PASSWORD = 'newpassword'


	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.activation_view_name = 'password_reset_detail'


	def setUp(self):
		self._init_user_references()
		super().setUp()


	def _after_successful_activation(self):
		'''
		Override. 'Activation' in this case is simply a check as to whether the key is correct, so the PasswordReset object is still needed.
		'''
		self._check_object_is_not_deleted()


	def test_creation_overwrites_other_pending_password_reset_for_user(self):
		first_reset = self._create_password_reset()
		second_reset = self._create_password_reset()

		first_reset.refresh_from_db()
		self.assertEqual(first_reset, second_reset)


	def test_full_password_reset(self):
		self._response = self._request_full_password_reset()
		self._check_for_reset_success()


	def _request_full_password_reset(self, key=None, new_password=None):
		if new_password is None:
			new_password = self.NEW_PASSWORD
		
		request_data = {
			'activation_key': key or get_activation_key_from_email(),
			'new_password': new_password,
		}

		return self._client.put(
			self._get_activation_url(),
			request_data,
			format='json',
		)


	def _check_for_reset_success(self):
		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self.assertTrue(self._login_with_new_password())


	def _login_with_new_password(self):
		login_details = dict(
			LoginDetails.ADDITIONAL,
			password=self.NEW_PASSWORD,
		)
		return self._client.login(**login_details)


	def test_cant_reset_password_with_invalid_key(self):
		self._response = self._request_full_password_reset(
			key='boguskey',
		)
		self._check_for_reset_failure()


	def _check_for_reset_failure(self):
		self.assertTrue(self._reset_failed())
		self.assertFalse(self._login_with_new_password())


	def _reset_failed(self):
		return request_denied(self._response) \
			or self._response.status_code == status.HTTP_400_BAD_REQUEST,


	def test_cant_reset_to_empty_password(self):
		self._response = self._request_full_password_reset(
			new_password='',
		)
		self._check_for_reset_failure()



class PasswordResetViewTest(
	PasswordResetTestCommon,
	ModelViewTestBase,
	TestCase,
):

	@classmethod
	def _init_params(cls):
		super()._init_params()

		cls.list_view_name = 'password_reset_list'
		cls.detail_view_name = 'password_reset_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_ONLY


	def setUp(self):
		self._init_user_references()
		super().setUp()


	def test_can_create_object_by_email_address_whilst_logged_out(self):
		response = self._create_object(
			login_details=None,
			data={'email': self._nonstaff_user.email},
		)

		self.assertContains(
			response,
			str(self._nonstaff_user.pk),
			status_code=status.HTTP_201_CREATED,
		)


	def test_cant_create_object_with_unknown_email_address(self):
		response = self._create_object(
			login_details=None,
			data={'email': 'unknown@email.com'},
		)

		self.assertEqual(
			response.status_code,
			status.HTTP_400_BAD_REQUEST,
		)
