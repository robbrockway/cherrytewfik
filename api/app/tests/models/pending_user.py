import re

from django.db import IntegrityError
from django.test import TestCase
from django.core import mail, urlresolvers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

from rest_framework.test import APIClient
from rest_framework import status

from app.models import *
from .modeltest_base import *



class PendingUserTestCommon:

	@classmethod
	def _init_params(cls):
		cls.model_class = PendingUser

		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'first_name': 'Testy',
			'last_name': 'McTestFace',
			'email': 'testy@mctestface.com',
			'password': 'passymcwordface',
		}

		cls.fields.changed = {
			'first_name': 'Facey',
			'last_name': 'McTesttest',
			'email': 'facey@mctesttest.com',
			'password': 'wordymcpassface',
		}



class PendingUserTest(
	PendingUserTestCommon,
	ModelTestBaseWithActivationKey,
	TestCase,
):

	@classmethod
	def _init_params(cls):
		super()._init_params()

		cls.activation_view_name = 'pending_user_detail'


	def test_create(self):
		user = PendingUser.objects.get()
		for key, value in self.fields.initial.items():
			if key != 'password':
				self.assertEqual(
					getattr(user, key),
					value,
				)


	def test_user_gets_guest_basket_after_activation(self):
		self._check_object_transfers_from_guest_to_new_user(Basket)


	def _check_object_transfers_from_guest_to_new_user(
		self,
		model_class,
		**extra_fields
	):
		object = model_class.objects.create(
			session_key=self._client.session.session_key,
			**extra_fields,
		)

		response = self._request_activation()
		new_user_pk = response.data['id']
		object.refresh_from_db()

		self.assertEqual(object.user.pk, new_user_pk)
		self.assertEqual(object.session_key, '')


	def test_user_gets_guest_order_after_activation(self):
		self._check_object_transfers_from_guest_to_new_user(
			Order,
			total_balance=0,
		)


	def test_user_gets_guest_address_after_activation(self):
		self._check_object_transfers_from_guest_to_new_user(
			Address,
			address='Address address',
		)


	def _after_successful_activation(self):
		super()._after_successful_activation()

		expected_email_address = self.fields.initial['email']

		self.assertContains(
			self._response,
			expected_email_address,
			status_code=status.HTTP_200_OK,
		)

		self._check_user_is_now_active()


	def _check_user_is_now_active(self):
		try:
			full_user = User.objects.get(
				email=self._object.email,
				first_name=self._object.first_name,
				last_name=self._object.last_name,
			)

			self._try_login(full_user)
		except User.DoesNotExist:
			self.fail('Activated user does not exist')


	def _try_login(self, user):
		login_details = {
			'email': user.email,
			'password': self.fields.initial['password'],
		}

		response = self._client.post(
			urlresolvers.reverse('login'),
			login_details,
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)



class PendingUserViewTest(
	PendingUserTestCommon,
	ModelViewTestBase,
	TestCase,
):

	DUPLICATION_TEST_EMAIL_ADDRESS = 'donot@duplicate.com'


	@classmethod
	def _init_params(cls):
		super()._init_params()

		cls.list_view_name = 'pending_user_list'
		cls.detail_view_name = 'pending_user_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_ONLY


	def test_create_object_as_nonstaff(self):
		'''
		Override; creation (i.e. registration) of a pending user is possible by anyone, not staff-only like all other operations, and involves receiving an activation email
		'''

		initial_outbox_size = len(mail.outbox)

		response = self._create_object(
			login_details=None,
			data=self.fields.changed,
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertGreater(len(mail.outbox), initial_outbox_size)


	def test_cant_create_without_all_fields(self):
		for field_name in self.fields.initial:
			self._response = self._create_object_without(field_name)
			self._check_response_for_field_requirement_error(field_name)


	def _create_object_without(self, field_name):
		creation_data = {
			k: v for k, v in self.fields.initial.items()
			if k != field_name
		}

		return self._create_object(
			login_details=None,
			data=creation_data,
		)


	def _check_response_for_field_requirement_error(self, field_name):
		self._check_response_for_field_error(
			field_name,
			'This field is required.',
		)


	def _check_response_for_field_error(self, field_name, error_message):
		self.assertTrue(field_name in self._response.data)

		self.assertEqual(
			self._response.data[field_name],
			[error_message],
		)

		self.assertEqual(
			self._response.status_code,
			status.HTTP_400_BAD_REQUEST,
		)


	def _check_response_for_values(self, dict):
		# Responses never contain password data
		passwordless_dict = {
			k: v for k, v in dict.items() if k != 'password'
		}

		super()._check_response_for_values(passwordless_dict)


	def test_cant_create_with_email_taken_by_full_user(self):
		creation_data = dict(
			self.fields.initial,
			username='full_user',
			email=self.DUPLICATION_TEST_EMAIL_ADDRESS,
		)

		full_user = User.objects.create_user(**creation_data)
		
		del creation_data['username']	# Not needed in PendingUser creation
		self._response = self._create_object(
			login_details=None,
			data=creation_data,
		)

		self._check_response_for_email_duplication_error(
			self.DUPLICATION_TEST_EMAIL_ADDRESS,
		)

	
	def _check_response_for_email_duplication_error(self, email_address):
		self._check_response_for_field_error(
			'email',
			'%s is already taken' % email_address,
		)


	def test_cant_create_with_email_taken_by_pending_user(self):
		self._response = self._create_object(login_details=None)
		self._check_response_for_email_duplication_error(
			self.fields.initial['email'],
		)
