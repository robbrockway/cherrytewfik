from django.test import TestCase

from .modeltest_base import *
from app.models import Address


class AddressTestCommon:

	INITIAL_ADDRESS_TEXT = (
		'3 Potty Lane\n'
		'Potterton\n'
		'PT4 3PT'
	)

	CHANGED_ADDRESS_TEXT = (
		'4 Pot Avenue\n'
		'Pottingham\n'
		'PH34 1PT'
	)


	@classmethod
	def _init_params(cls):
		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'address': cls.INITIAL_ADDRESS_TEXT,
		}

		cls.fields.changed = {
			'address': cls.CHANGED_ADDRESS_TEXT,
		}

		cls.model_class = Address



class AddressTest(
	AddressTestCommon,
	ModelTestBaseWithOwner,
	TestCase,
):
	pass



class AddressViewTest(
	AddressTestCommon,
	ModelViewTestBaseWithOwner,
	TestCase,
):

	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.list_view_name = 'address_list'
		cls.detail_view_name = 'address_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_ONLY


	def test_can_list_own_addresses_as_guest(self):
		self._give_address_to_guest()
		response = self._list_objects()
		
		self.assertEqual(
			response.data[0]['address'],
			self.fields.initial['address'],
		)


	def test_cant_list_other_addresses_as_guest(self):
		response = self._list_objects()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertFalse(len(response.data))


	def _give_address_to_guest(self, session_key=None):
		session_key = session_key or self._get_session_key()
		Address.objects.update(
			user=None,
			session_key=session_key,
		)


	def test_can_create_address_as_owner(self):
		self._response = self._create_object(
			LoginDetails.ADDITIONAL,
			data=self._get_initial_fields_without_user(),
		)

		self._check_response_for_values(
			self.fields.initial,
			status_code=status.HTTP_201_CREATED,
		)


	def test_can_create_address_as_guest(self):
		response = self._create_object(
			data=self._get_initial_fields_without_user(),
		)

		self.assertContains(
			response,
			self._get_session_key(),
			status_code=status.HTTP_201_CREATED,
		)


	def test_can_retrieve_address_as_owner(self):
		self._response = self._retrieve_object(LoginDetails.ADDITIONAL)
		self._check_response_for_values(self.fields.initial)


	def test_can_retrieve_address_as_guest(self):
		self._give_address_to_guest()
		response = self._retrieve_object()
		self.assertEqual(response.status_code, status.HTTP_200_OK)


	def test_cant_retrieve_address_as_wrong_guest(self):
		self._give_address_to_wrong_guest()
		response = self._retrieve_object()
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def _give_address_to_wrong_guest(self):
		self._give_address_to_guest(session_key='wrong_session_key')


	def test_can_destroy_address_as_owner(self):
		self._check_can_destroy_address(LoginDetails.ADDITIONAL)


	def _check_can_destroy_address(self, login_details=None):
		response = self._destroy_object(login_details)
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


	def test_can_destroy_address_as_guest(self):
		self._give_address_to_guest()
		self._check_can_destroy_address(login_details=None)


	def test_cant_destroy_address_as_wrong_guest(self):
		self._give_address_to_wrong_guest()
		response = self._destroy_object(login_details=None)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def _get_initial_fields_without_user(self):
		return {
			'address': self.fields.initial['address'],
		}