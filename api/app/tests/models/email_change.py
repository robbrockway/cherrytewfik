from contextlib import suppress

from django.test import TestCase
from django.core import mail, urlresolvers
from django.contrib.auth.models import User

from rest_framework.test import APIClient

from .modeltest_base import *
from .. import request_denied
from app.models import EmailChange



class EmailChangeTestCommon:

	INITIAL_EMAIL = 'initial@email.com'
	CHANGED_EMAIL = 'changed@email.com'

	EMAIL_CHANGE_LOGIN_DETAILS = LoginDetails.ADDITIONAL


	@classmethod
	def _init_params(cls):
		cls.model_class = EmailChange

		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'new_email': cls.CHANGED_EMAIL,
		}

		cls.fields.changed = {
			'new_email': cls.INITIAL_EMAIL,
		}


	def _init_user_references(self):
		# User data is specific to each instance of this class, so is created here rather than in _init_params()
		self._init_users()
		
		email_change_user_profile = dict(
			self.ADDITIONAL_PROFILE,
			email=self.INITIAL_EMAIL,
		)

		self._email_change_user = User.objects.create_user(
			**email_change_user_profile,
		)

		self.fields.initial['user'] = self._email_change_user
		self.fields.changed['user'] = self._nonstaff_user


	def _create_email_change(self, user=None, new_email=None):
		return EmailChange.objects.create(
			user or self._email_change_user,
			new_email or self.CHANGED_EMAIL,
		)




class EmailChangeTest(
	EmailChangeTestCommon,
	ModelTestBaseWithActivationKey,
	TestWithUsers,
	TestCase,
):

	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.activation_view_name = 'email_change_detail'


	def setUp(self):
		self._init_user_references()
		super().setUp()


	def test_creation_overwrites_other_pending_email_change_for_user(self):
		first_change = self._create_email_change()
		second_change = self._create_email_change(
			new_email='changedagain@email.com',
		)

		first_change.refresh_from_db()
		self.assertEqual(first_change, second_change)


	def _after_successful_activation(self):
		super()._after_successful_activation()

		self._email_change_user.refresh_from_db()
		self.assertEqual(self._email_change_user.email, self.CHANGED_EMAIL)
		self._check_response_for_updated_user()


	def _check_response_for_updated_user(self):
		self.assertEqual(
			self._response.data['username'],
			self._email_change_user.username,
		)

		self.assertEqual(
			self._response.data['email'],
			self.CHANGED_EMAIL,
		)

		self.assertFalse(self._response.data['email_change'])


	def _after_failed_activation(self):
		super()._after_failed_activation()
		self._check_email_is_unchanged()


	def _check_email_is_unchanged(self):
		self._email_change_user.refresh_from_db()
		self.assertEqual(self._email_change_user.email, self.INITIAL_EMAIL)


	def test_cant_activate_change_to_already_taken_email(self):
		response = self._request_activate_change_to_already_taken_email()
		self.assertTrue(request_denied(response))


	def _request_activate_change_to_already_taken_email(self):
		self._staff_user.email = self._object.new_email
		self._staff_user.save()

		return self._request_activation()


	def test_change_to_already_taken_email_deleted_on_activation_attempt(self):
		self._request_activate_change_to_already_taken_email()

		with suppress(EmailChange.DoesNotExist):
			self._object.refresh_from_db()
			self.fail('EmailChange object should have been deleted')



class EmailChangeViewTest(
	EmailChangeTestCommon,
	ModelViewTestBase,
	TestCase,
):

	@classmethod
	def _init_params(cls):
		super()._init_params()

		cls.list_view_name = 'email_change_list'
		cls.detail_view_name = 'email_change_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_ONLY


	def setUp(self):
		self._init_user_references()
		super().setUp()


	def test_owner_can_create_object(self):
		creation_data = dict(
			self.fields.initial,
			user=self._nonstaff_user,
		)

		response = self._create_object(
			LoginDetails.NONSTAFF,
			data=creation_data,
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)


	def test_owner_can_retrieve_object(self):
		response = self._retrieve_object(
			self.EMAIL_CHANGE_LOGIN_DETAILS,
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
