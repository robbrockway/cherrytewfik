from datetime import datetime
from decimal import Decimal
import random

from django.core import urlresolvers, mail
from django.core.exceptions import ValidationError
from django.db.models.query import QuerySet
from django.test import TestCase

from rest_framework import status

import braintree

from django_config.settings import CT_ADMIN_EMAIL
from app.models import *
from app.views.order import TransactionVoidFailed
from .modeltest_base import *
from .address import AddressTestCommon
from .piece import PieceTestCommon
from .. import ancient_time



class OrderTestCommon:

	GUEST_CUSTOMER_NAME = 'Guesty McGuestface'
	

	@classmethod
	def setUpTestData(cls):
		cls._init_params()


	@classmethod
	def _init_params(cls):
		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'customer_name': cls.GUEST_CUSTOMER_NAME,
			'email': 'guest@address.com',
			'recipient_name': 'Testy McTestface',
			'status': Order.PENDING,
			'datetime': datetime(2015, 8, 23),
			'address': AddressTestCommon.INITIAL_ADDRESS_TEXT,
			'total_balance': 50.,
		}

		cls.fields.changed = {
			'recipient_name': 'Facey McTesttest',
			'status': Order.OPEN,
			'datetime': datetime(2016, 11, 9),
			'address': AddressTestCommon.CHANGED_ADDRESS_TEXT,
			'total_balance': 75.,
		}

		cls.model_class = Order


	def _check_braintree_transaction_status_is(
		self,
		transaction_id,
		expected_status,
	):
		transaction = braintree.Transaction.find(transaction_id)
		self.assertEqual(transaction.status, expected_status)


	def _get_nonexistent_order_pk(self):
		while True:
			pk = ModelBase.unchecked_random_pk()
			try:
				Order.objects.get(pk=pk)
			except Order.DoesNotExist:
				return pk



class OrderTest(
	OrderTestCommon,
	ModelTestBaseWithOwner,
	TestCase,
):

	PIECE_TEST_PRICE = 50.


	def test_get_email_returns_user_email(self):
		self.assertEqual(
			self._object.get_email(),
			self._object.user.email,
		)


	def test_get_email_returns_specific_email_for_guest_order(self):
		self._set_order_to_guest()
		self.assertEqual(
			self._object.get_email(),
			self._object.email,
		)


	def _set_order_to_guest(self):
		self._object.user = None
		self._object.email = self.GUEST_EMAIL_ADDRESS
		self._object.customer_name = self.GUEST_CUSTOMER_NAME
		self._object.save()
		

	def test_get_customer_name_returns_user_full_name(self):
		user = self._object.user
		self.assertEqual(
			self._object.get_customer_name(),
			' '.join([user.first_name, user.last_name]),
		)


	def test_get_customer_name_returns_customer_name_for_guest_order(self):
		self._set_order_to_guest()
		self.assertEqual(
			self._object.get_customer_name(),
			self._object.customer_name,
		)


	def test_get_customer_name_returns_recipient_name_if_all_else_fails(self):
		self._set_order_to_guest()
		self._object.customer_name = ''

		self.assertEqual(
			self._object.get_customer_name(),
			self._object.recipient_name,
		)


	def test_get_email_with_name(self):
		expected_email_with_name = '%s <%s>' % (
			self._object.get_customer_name(),
			self._object.get_email(),
		)

		self.assertEqual(
			self._object.get_email_with_name(),
			expected_email_with_name,
		)


	def test_get_address_lines(self):
		lines = self._object.get_address_lines()
		self.assertTrue(isinstance(lines, list))
		self.assertEqual(lines[0], '3 Potty Lane')


	def test_total_balance_matches_pieces_positive_case(self):
		self._create_balance_test_piece()
		self._object.total_balance = self.PIECE_TEST_PRICE
		self.assertTrue(self._object.total_balance_matches_pieces())


	def _create_balance_test_piece(self):
		Piece.objects.create(
			order=self._object,
			price=self.PIECE_TEST_PRICE,
		)


	def test_total_balance_matches_pieces_negative_case(self):
		self._create_balance_test_piece()
		self._object.total_balance = self.PIECE_TEST_PRICE + 10
		self.assertFalse(self._object.total_balance_matches_pieces())


	def test_update_total_balance(self):
		self._create_balance_test_piece()
		self._object.update_total_balance()
		self.assertTrue(self._object.total_balance_matches_pieces())



class OrderViewTestCommon(
	OrderTestCommon,
	TestWithUsers,
):

	# Separate lists of pieces. One of which is included in our test order; the other are kept in a basket and appended later
	order_piece_fields_list = [
		{'name': 'First ordered piece'},
		{'name': 'Second ordered piece'},
		{'name': 'Third ordered piece'},
	]

	basket_piece_fields_list = [
		{'name': 'First basket piece'},
		{'name': 'Second basket piece'},
		{'name': 'Third basket piece'},
	]


	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.list_view_name = 'order_list'
		cls.detail_view_name = 'order_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_ONLY

		cls._init_random_balance()


	@classmethod
	def _init_random_balance(cls):
		cls.fields.initial['total_balance'] = Decimal('0.00')

		for piece_fields in cls._get_all_piece_fields():
			piece_fields['price'] = \
				cls._random_price_to_avoid_braintree_duplication_check()

		cls.fields.initial['total_balance'] = sum(
			piece_fields['price'] for piece_fields in cls.order_piece_fields_list
		)


	@classmethod
	def _get_all_piece_fields(cls):
		return cls.order_piece_fields_list + cls.basket_piece_fields_list


	@classmethod
	def _random_price_to_avoid_braintree_duplication_check(cls):
		unrounded_balance = Decimal(random.uniform(10, 100))
		return round(unrounded_balance, 2)


	def _init_order_with_pieces(self, **order_kwargs):
		self._order = Order.objects.create(**order_kwargs)

		for piece_fields in self.order_piece_fields_list:
			Piece.objects.create(order=self._order, **piece_fields)


	def _init_basket_with_pieces(self, **basket_kwargs):
		self._basket = Basket.objects.create(**basket_kwargs)

		for piece_fields in self.basket_piece_fields_list:
			Piece.objects.create(basket=self._basket, **piece_fields)


	def _get_settled_braintree_transaction_id(self):
		return self._get_braintree_transaction_id(settled=True)


	def _get_braintree_transaction_id(self, settled=False):
		sale = braintree.Transaction.sale({
			'amount': self.fields.initial['total_balance'],
			'payment_method_nonce': 'fake-valid-nonce',
			'options': {
				'submit_for_settlement': settled,
			},
		})

		return sale.transaction.id


	def _get_new_braintree_transaction_from_order(self):
		self._order.refresh_from_db()
		return braintree.Transaction.find(
			self._order.braintree_transaction_id,
		)


	def _create_address(self):
		fields = {
			'address': AddressTestCommon.INITIAL_ADDRESS_TEXT,
			'user': self._additional_user,
		}

		address = Address(**fields)
		address.save()
		return address


	def _empty_pieces_from_order(self):
		Piece.objects.update(order=None)


	def _check_outbox_contains_message(
		self,
		recipient_address,
		subject,
	):
		self.assertTrue(
			self._outbox_contains_message(
				recipient_address,
				subject,
			),
		)

		
	def _outbox_contains_message(
		self,
		recipient_address,
		subject,
	):
		return any(
			recipient_address in message.to[0]
			and message.subject == subject
			for message in mail.outbox
		)


	def _check_outbox_doesnt_contain_message(
		self,
		recipient_address,
		subject,
	):
		self.assertFalse(
			self._outbox_contains_message(
				recipient_address,
				subject,
			),
		)


	def _get_user_email_with_name(self, user=None):
		user = user or self._additional_user

		return '%s %s <%s>' % (
			user.first_name,
			user.last_name,
			user.email,
		)


	def _get_expected_admin_edit_notification_email_subject(self, user=None):
		return '%s\'s order has been edited' % \
			self._get_users_full_name(user)


	def _get_users_full_name(self, user=None):
		user = user or self._nonstaff_user

		return ' '.join([
			user.first_name,
			user.last_name,
		])


	def _get_expected_admin_cancel_notification_email_subject(self, user=None):
		return '%s\'s order has been cancelled' % \
			self._get_users_full_name(user)



class OrderMainViewTest(
	OrderViewTestCommon,
	ModelViewTestBaseWithOwner,
	TestCase,
):

	def setUp(self):
		self._init_additional_user()
		self._init_basket_with_pieces(user=self._additional_user)
		super().setUp()

		self.nonstaff_fields = {
			'recipient_name': 'Facey McTesttest',
			'customer_name': 'Testy McFacetest',
			'address': self._create_address(),
		}

		self.guest_fields = {
			k: v.address if k == 'address' else v
			for k, v in self.nonstaff_fields.items()
		}
		self.guest_fields['email'] = 'anonymous@user.com'


	def test_can_create_guest_order_with_email(self):
		response = self._create_guest_order()
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)


	def _create_guest_order(self):
		self._init_basket_with_pieces(session_key=self._get_session_key())

		return self._create_object(
			login_details=None,
			data=self.guest_fields,
		)


	def test_cant_create_guest_order_without_email(self):
		response = self._create_object(
			login_details=None,
			data=self.guest_fields,
		)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_create_guest_order_with_presaved_address(self):
		response = self._create_object(
			login_details=None,
			data=self.nonstaff_fields,
		)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_can_view_own_guest_order(self):
		creation_response = self._create_guest_order()
		
		retrieval_response = self._retrieve_object(
			pk=creation_response.data['id'],
		)

		self.assertTrue(all(
			creation_response.data[field] == retrieval_response.data[field]
			for field in [
				'id',
				'status',
				'address',
				'total_balance',
				'pieces',
			]
		))


	def test_cant_view_other_guest_order(self):
		creation_response = self._create_guest_order()
		Order.objects.update(session_key='bogus_session_key')
		
		retrieval_response = self._retrieve_object(
			pk=creation_response.data['id'],
		)

		self.assertEqual(retrieval_response.status_code, status.HTTP_403_FORBIDDEN)


	def test_can_create_order_as_nonstaff_with_sparse_params(self):
		self._response = self._create_order_as_nonstaff()

		self.assertEqual(
			self._response.status_code,
			status.HTTP_201_CREATED,
		)

		self._compare_response_to_creation_data(
			self.nonstaff_fields,
		)

		self._check_response_for_piece_list()


	def _create_order_as_nonstaff(self, **extra_creation_data):
		creation_data = dict(self.nonstaff_fields, **extra_creation_data)
		self._add_pieces_to_additional_users_basket()
		
		return self._create_object(
			LoginDetails.ADDITIONAL,
			creation_data,
		)


	def _compare_response_to_creation_data(self, creation_data):
		self.assertEqual(
			self._response.data['recipient_name'],
			creation_data['recipient_name'],
		)

		# Address should be text, rather than an 'address' object pk, in response
		self.assertEqual(
			self._response.data['address'],
			creation_data['address'].address,
		)


	def _add_pieces_to_additional_users_basket(self):
		Piece.objects.update(
			order=None,
			basket=self._basket,
		)


	def test_creation_generates_braintree_client_token(self):
		current_token = lambda: \
			self._client.session.get('braintree_client_token')

		initial_token = current_token()
		self._create_guest_order()
		self.assertNotEqual(initial_token, current_token())


	def test_can_view_pieces_as_part_of_order(self):
		self._response = self._retrieve_object(
			LoginDetails.ADDITIONAL,
		)
		self._check_response_for_piece_list()


	def _check_response_for_piece_list(self):
		self.assertTrue('pieces' in self._response.data)
		response_piece_dict_list = remove_keys_from_list_of_dicts(
			self._response.data['pieces'],
			'id', 'order', 'index_in_cat',
		)

		self.assertTrue(
			dict_lists_are_equal_for_nonempty_values(
				response_piece_dict_list,
				self.basket_piece_fields_list,
			),
		)


	def test_recipient_name_defaults_to_users_full_name(self):
		self._add_pieces_to_additional_users_basket()

		response = self._create_object(
			LoginDetails.ADDITIONAL,
			data={'address': self.nonstaff_fields['address']},
		)

		expected_recipient_name = ' '.join([
			self._additional_user.first_name,
			self._additional_user.last_name,
		])

		self.assertEqual(
			response.data['recipient_name'],
			expected_recipient_name,
		)


	def test_cant_set_order_status_on_creation_unless_staff(self):
		response = self._create_order_as_nonstaff(status=Order.OPEN)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_cant_set_order_user_on_creation_unless_staff(self):
		self._check_order_creation_fails_with(
			user=self.fields.initial['user'],
		)


	def _check_order_creation_fails_with(self, **extra_creation_data):
		response = self._create_order_as_nonstaff(**extra_creation_data)
		self.assertTrue(request_denied(response))


	def test_cant_set_order_balance_on_creation_unless_staff(self):
		self._check_order_creation_fails_with(
			total_balance=self.fields.initial['total_balance'],
		)


	def test_cant_set_order_datetime_on_creation_unless_staff(self):
		self._check_order_creation_fails_with(
			datetime=self.fields.initial['datetime'],
		)


	def test_cant_create_order_from_empty_basket(self):
		self._check_creation_raises_bad_request_error()


	def _check_creation_raises_bad_request_error(self):
		response = self._create_object(
			LoginDetails.ADDITIONAL,
			data=self.nonstaff_fields,
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_create_order_from_expired_basket(self):
		self._add_pieces_to_additional_users_basket()
		Basket.objects.update(last_updated=ancient_time())
		self._check_creation_raises_bad_request_error()


	def test_can_edit_own_order_metadata(self):
		self._response = self._partially_update_object(
			LoginDetails.ADDITIONAL,
			data=self.nonstaff_fields,
		)

		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._compare_response_to_creation_data(
			creation_data=self.nonstaff_fields,
		)


	def test_cant_edit_other_order_metadata(self):
		response = self._partially_update_object(
			LoginDetails.NONSTAFF,
			data=self.nonstaff_fields,
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_cant_edit_braintree_transaction_id(self):
		order = Order.objects.first()
		old_transaction_id = order.braintree_transaction_id

		response = self._partially_update_object(
			LoginDetails.ADDITIONAL,
			data={'braintree_transaction_id': 'new'},
		)

		self.assertTrue('braintree_transaction_id' not in response.data)
		order.refresh_from_db()
		self.assertEqual(
			old_transaction_id,
			order.braintree_transaction_id,
		)


	def _check_cant_patch_own_order_with(self, **fields):
		self._response = self._partially_update_object(
			LoginDetails.ADDITIONAL,
			data=fields,
		)
		self.assertTrue(request_denied(self._response))


	def test_cant_edit_metadata_of_already_dispatched_order(self):
		Order.objects.update(status=Order.DISPATCHED)
		self._check_cant_patch_own_order_with(**self.nonstaff_fields)


	def test_cant_make_status_open_for_empty_order(self):
		self._check_for_failed_status_creation_on_empty_order(
			order_status=Order.OPEN,
		)


	def test_cant_set_order_status_on_update_unless_staff(self):
		self._check_order_update_fails_with(status=Order.OPEN)


	def _check_order_update_fails_with(self, **data):
		response = self._partially_update_object(
			LoginDetails.ADDITIONAL,
			data=data,
		)
		self.assertTrue(request_denied(response))


	def test_cant_set_order_user_on_update_unless_staff(self):
		self._check_order_update_fails_with(
			user=self.fields.initial['user'],
		)


	def test_cant_set_order_balance_on_update_unless_staff(self):
		self._check_order_update_fails_with(
			total_balance=self.fields.initial['total_balance'],
		)


	def test_cant_set_order_datetime_on_update_unless_staff(self):
		self._check_order_update_fails_with(
			datetime=self.fields.initial['datetime'],
		)


	def test_cant_make_status_open_for_empty_order(self):
		self._check_for_failed_status_update_on_empty_order(
			order_status=Order.OPEN,
		)

	def _check_for_failed_status_update_on_empty_order(self, order_status):
		self._empty_pieces_from_order()
		
		response = self._partially_update_object(
			LoginDetails.STAFF,
			data={'status': order_status},
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_make_status_dispatched_for_empty_order(self):
		self._check_for_failed_status_update_on_empty_order(
			order_status=Order.DISPATCHED,
		)


	def test_can_make_status_open_for_populated_order(self):
		self._check_for_successful_status_update_on_populated_order(
			order_status=Order.OPEN,
		)


	def _check_for_successful_status_update_on_populated_order(
		self,
		order_status,
	):
		response = self._partially_update_object(
			LoginDetails.STAFF,
			data={'status': order_status},
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['status'], order_status)


	def test_can_make_status_dispatched_for_populated_order(self):
		self._check_for_successful_status_update_on_populated_order(
			order_status=Order.DISPATCHED,
		)


	def test_can_cancel_own_order(self):
		self._check_can_create_and_cancel_order(
			LoginDetails.NONSTAFF,
			user=self._nonstaff_user,
		)


	def _check_can_create_and_cancel_order(
		self,
		login_details=None,
		**extra_fields
	):
		response = self._create_and_cancel_order(
			login_details,
			**extra_fields,
		)
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


	def _create_and_cancel_order(self, login_details=None, **extra_fields):
		fields = dict(self.fields.initial, **extra_fields)
		order = Order.objects.create(**fields)

		return self._destroy_object(
			login_details,
			pk=order.pk,
		)


	def test_can_cancel_own_guest_order(self):
		self._check_can_create_and_cancel_order(
			login_details=None,
			session_key=self._get_session_key(),
		)


	def test_cant_cancel_other_order(self):
		self._check_cant_create_and_cancel_order(
			login_details=LoginDetails.NONSTAFF,
			user=self._additional_user,
		)


	def _check_cant_create_and_cancel_order(
		self,
		login_details=None,
		**extra_fields
	):
		response = self._create_and_cancel_order(
			login_details,
			**extra_fields,
		)
		self.assertTrue(request_denied(response))


	def test_cant_cancel_other_guest_order(self):
		self._check_cant_create_and_cancel_order(
			login_details=None,
			session_key='bogus_session_key',
		)


	def test_can_cancel_dispatched_order_as_staff(self):
		response = self._create_and_cancel_dispatched_order(
			LoginDetails.STAFF,
		)

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


	def _create_and_cancel_dispatched_order(self, login_details):
		transaction_id = self._get_settled_braintree_transaction_id()
		
		return self._create_and_cancel_order(
			login_details,
			user=self._nonstaff_user,
			status=Order.DISPATCHED,
			braintree_transaction_id=transaction_id,
		)


	def test_cant_cancel_dispatched_order_as_nonstaff(self):
		response = self._create_and_cancel_dispatched_order(
			LoginDetails.NONSTAFF,
		)

		self.assertTrue(request_denied(response))


	def test_cancelling_own_order_sends_user_email(self):
		self._destroy_object(
			LoginDetails.ADDITIONAL,
		)

		self._check_outbox_contains_message(
			recipient_address=self._get_user_email_with_name(),
			subject='Your order has been cancelled',
		)


	def test_cancelling_own_order_sends_admin_notification_email(self):
		self._destroy_object(
			LoginDetails.ADDITIONAL,
		)

		expected_subject = \
			self._get_expected_admin_cancel_notification_email_subject(
				user=self._additional_user,
			)

		self._check_outbox_contains_message(
			recipient_address=CT_ADMIN_EMAIL,
			subject=expected_subject,
		)


	def test_cancelling_dispatched_order_sends_user_email(self):
		Order.objects.update(status=Order.DISPATCHED)

		self._destroy_object(
			LoginDetails.STAFF,
		)

		self._check_outbox_contains_message(
			recipient_address=self._get_user_email_with_name(),
			subject='Your purchase has been refunded',
		)


	def test_cancelling_open_order_voids_transaction(self):
		transaction_status = \
			self._get_transaction_status_after_cancelling_order(
				initial_order_status=Order.OPEN,
			)

		self.assertEqual(transaction_status, 'voided')


	def _get_transaction_status_after_cancelling_order(
		self,
		initial_order_status,
		transaction_id=None,
	):
		transaction_id = transaction_id \
			or self._get_braintree_transaction_id()

		self._create_and_cancel_order(
			LoginDetails.STAFF,
			user=self._nonstaff_user,
			braintree_transaction_id=transaction_id,
			status=initial_order_status,
		)
		
		transaction = braintree.Transaction.find(transaction_id)
		return transaction.status


	def test_cancelling_dispatched_order_refunds_or_voids_transaction(
		self,
	):
		transaction_id = self._get_settled_braintree_transaction_id()

		transaction_status = \
			self._get_transaction_status_after_cancelling_order(
				initial_order_status=Order.DISPATCHED,
				transaction_id=transaction_id,
			)

		self.assertTrue(transaction_status in ('refunded', 'voided'))


	def test_bad_transaction_void_throws_error(self):
		response = self._create_and_cancel_own_order(
			status=Order.OPEN,
			braintree_transaction_id='bogus',
		)

		self.assertEqual(
			response.status_code,
			status.HTTP_500_INTERNAL_SERVER_ERROR,
		)

		self.assertEqual(
			response.data['detail'],
			TransactionVoidFailed.default_detail,
		)


	def _create_and_cancel_own_order(self, **extra_fields):
		return self._create_and_cancel_order(
			LoginDetails.NONSTAFF,
			user=self._nonstaff_user,
			**extra_fields,
		)



class OrderEditViewTestCommon(OrderViewTestCommon):
	'''
	A few utilities and built-in tests for appending to and removing from orders.

	Subclasses must implement _perform_edit(), to do the actual adding/removal.
	'''

	def setUp(self):
		super().setUp()
		self._init_additional_user()

		self._init_order_with_pieces(
			user=self._nonstaff_user,
			**self.fields.initial,
		)


	def test_can_edit_own_order(self):
		self._response = self._perform_edit(LoginDetails.NONSTAFF)
		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._check_response_for_successful_edit()


	def _check_response_for_successful_edit(self):
		pass


	def test_cant_edit_other_order(self):
		self._response = self._perform_edit(LoginDetails.ADDITIONAL)
		self.assertTrue(request_denied(self._response))


	def test_can_edit_other_order_as_staff(self):
		self._response = self._perform_edit(LoginDetails.STAFF)
		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._check_response_for_successful_edit()


	def test_can_edit_own_guest_order(self):
		self._assign_order_to_guest()
		self._response = self._perform_edit()
		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._check_response_for_successful_edit()


	def _assign_order_to_guest(self):
		Order.objects.update(
			user=None,
			session_key=self._get_session_key(),
		)


	def test_cant_edit_other_guest_order(self):
		Order.objects.update(
			user=None,
			session_key='incorrect_session_key',
		)

		self._response = self._perform_edit()
		self.assertTrue(request_denied(self._response))


	def test_cant_edit_nonexistent_order(self):
		response = self._perform_edit(
			LoginDetails.STAFF,
			self._get_nonexistent_order_pk(),
		)

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


	def test_can_edit_own_open_order(self):
		self._make_order_open()
		self._response = self._perform_edit(LoginDetails.NONSTAFF)
		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._check_response_for_successful_edit()
	
	
	def _make_order_open(self):
		self._order.status = Order.OPEN
		self._order.braintree_transaction_id = \
			self._get_braintree_transaction_id()
		self._order.save()


	def test_editing_open_order_voids_old_transaction(self):
		self._make_order_open()
		transaction_id = self._order.braintree_transaction_id

		self._perform_edit(LoginDetails.NONSTAFF)

		self._check_braintree_transaction_status_is(
			transaction_id,
			'voided',
		)


	def test_editing_open_order_creates_new_transaction(self):
		self._make_order_open()
		old_transaction_id = self._order.braintree_transaction_id

		response = self._perform_edit(LoginDetails.NONSTAFF)

		self._order.refresh_from_db()
		new_transaction_id = self._order.braintree_transaction_id
		self.assertNotEqual(old_transaction_id, new_transaction_id)

		self._check_braintree_transaction_status_is(
			new_transaction_id,
			'authorized',
		)


	def test_cant_edit_open_order_with_invalid_nonce(self):
		self._make_order_open()
		response = self._perform_edit(
			LoginDetails.NONSTAFF,
			nonce='bogus_nonce',
		)

		self.assertTrue(request_denied(response))


	def test_payment_failure_keeps_old_transaction_intact(self):
		self._make_order_open()
		old_transaction_id = self._order.braintree_transaction_id
		
		self._perform_edit(
			LoginDetails.NONSTAFF,
			nonce='bogus_nonce',
		)

		self._order.refresh_from_db()
		self.assertEqual(
			old_transaction_id,
			self._order.braintree_transaction_id,
		)

		self._check_braintree_transaction_status_is(
			old_transaction_id,
			'authorized',
		)


	def test_transaction_matches_new_balance_after_edit(self):
		self._make_order_open()
		response = self._perform_edit(LoginDetails.NONSTAFF)
		transaction = self._get_new_braintree_transaction_from_order()

		self.assertEqual(
			transaction.amount,
			Decimal(response.data['total_balance']),
		)


	def test_cant_edit_dispatched_order(self):
		self._make_order_dispatched()
		response = self._perform_edit(LoginDetails.NONSTAFF)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def _make_order_dispatched(self):
		self._order.status = Order.DISPATCHED
		self._order.braintree_transaction_id = \
			self._get_settled_braintree_transaction_id()
		self._order.save()


	def test_edit_sends_receipt_email(self):
		self._perform_edit(LoginDetails.NONSTAFF)
		self._check_outbox_contains_message(
			recipient_address=self._order.get_email_with_name(),
			subject='Your order has been edited',
		)


	def test_edit_sends_admin_notification_email(self):
		expected_subject = \
			self._get_expected_admin_edit_notification_email_subject()

		self._perform_edit(LoginDetails.NONSTAFF)
		self._check_outbox_contains_message(
			recipient_address=CT_ADMIN_EMAIL,
			subject=expected_subject,
		)


	def _get_piece_pks_from_response(self):
		return [
			piece_dict['id']
			for piece_dict in self._response.data['pieces']
		]



class OrderPieceRemovalViewTest(
	OrderEditViewTestCommon,
	TestCase,
):

	def _perform_edit(self, login_details=None, order_pk=None, **kwargs):
		'''
		Called by OrderEditViewTestCommon superclass
		'''
		return self._remove_first_piece_from_order(
			login_details,
			order_pk,
			**kwargs,
		)
	

	def _remove_first_piece_from_order(
		self,
		login_details=None,
		order_pk=None,
		**kwargs
	):
		return self._remove_pieces_from_order(
			login_details,
			Piece.objects.first(),
			order_pk=order_pk,
			**kwargs,
		)


	@logged_in
	def _remove_pieces_from_order(self, *pieces, **kwargs):
		pieces = pieces or Piece.objects.all()
		piece_pks = self._get_piece_pks(pieces)
		order_pk = kwargs.get('order_pk')

		request_data = {
			'pieces': piece_pks,
			'new_total_balance': self._total_balance_without(*piece_pks),
			'nonce': 'fake-valid-nonce',
		}
		request_data.update(kwargs)

		return self._client.put(
			self._get_remove_from_order_url(order_pk),
			request_data,
			format='json',
		)


	def _get_piece_pks(self, pieces):
		return (
			pieces.values_list('id', flat=True)
			if isinstance(pieces, QuerySet)
			else [piece.pk for piece in pieces]
		)


	def _total_balance_without(self, *piece_pks):
		pieces = Piece.objects.exclude(pk__in=piece_pks)
		return piece_price_sum(pieces)


	def _get_remove_from_order_url(self, pk):
		return urlresolvers.reverse(
			'remove_from_order',
			kwargs={'pk': pk or self._order.pk},
		)


	def _check_response_for_successful_edit(self):
		'''
		Called by superclass after each test_can_edit_own_[x]_order
		'''
		self._check_response_excludes_first_piece()


	def _check_response_excludes_first_piece(self):
		self._check_response_excludes_pieces(
			Piece.objects.first(),
		)


	def _check_response_excludes_pieces(self, *pieces):
		pieces = pieces or Piece.objects.all()
		piece_pks_from_response = self._get_piece_pks_from_response()

		for piece in pieces:
			self.assertFalse(piece.pk in piece_pks_from_response)


	def test_cant_remove_pieces_that_arent_in_this_order(self):
		Piece.objects.update(order=None)
		self._response = self._remove_pieces_from_order(
			LoginDetails.NONSTAFF,
		)

		self.assertEqual(
			self._response.status_code,
			status.HTTP_400_BAD_REQUEST,
		)
		self._check_response_error_message_for_all_piece_pks()


	def _check_response_error_message_for_all_piece_pks(self):
		for pk in Piece.objects.values_list('id', flat=True):
			self.assertTrue(str(pk) in self._response.data[0])


	def test_cant_remove_with_incorrect_new_total_balance(self):
		piece = Piece.objects.first()
		incorrect_balance = self._total_balance_without(piece.pk) + 10

		response = self._remove_pieces_from_order(
			LoginDetails.NONSTAFF,
			piece,
			new_total_balance=incorrect_balance,
		)
		
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_can_remove_multiple_pieces(self):
		last_piece = Piece.objects.last()
		pieces = Piece.objects.exclude(pk=last_piece.pk) # Keep one piece so's not to delete the order

		self._response = self._remove_pieces_from_order(
			LoginDetails.NONSTAFF,
			*pieces
		)

		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._check_response_excludes_pieces(*pieces)


	def test_removing_reduces_total_balance(self):
		initial_total_balance = self._order.total_balance
		piece = Piece.objects.first()

		response = self._remove_pieces_from_order(
			LoginDetails.NONSTAFF,
			piece,
		)
		
		self.assertEqual(
			Decimal(response.data['total_balance']),
			initial_total_balance - piece.price,
		)


	def test_removing_all_pieces_deletes_order(self):
		response = self._remove_pieces_from_order(LoginDetails.NONSTAFF)
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

		with suppress(Order.DoesNotExist):
			self._order.refresh_from_db()
			self.fail('Order still exists')


	def test_removing_all_pieces_voids_transaction(self):
		self._make_order_open()
		response = self._remove_pieces_from_order(LoginDetails.NONSTAFF)

		self._check_braintree_transaction_status_is(
			self._order.braintree_transaction_id,
			'voided',
		)


	def test_removing_all_pieces_sends_cancellation_email(self):
		response = self._remove_pieces_from_order(LoginDetails.NONSTAFF)
		self._check_outbox_contains_message(
			self._get_user_email_with_name(self._nonstaff_user),
			subject='Your order has been cancelled',
		)


	def test_removing_all_pieces_sends_admin_cancellation_email(self):
		response = self._remove_pieces_from_order(LoginDetails.NONSTAFF)

		subject = \
			self._get_expected_admin_cancel_notification_email_subject()

		self._check_outbox_contains_message(
			recipient_address=CT_ADMIN_EMAIL,
			subject=subject,
		)


	def test_removing_all_pieces_doesnt_send_edit_email(self):
		response = self._remove_pieces_from_order(LoginDetails.NONSTAFF)

		self._check_outbox_doesnt_contain_message(
			self._get_user_email_with_name(self._nonstaff_user),
			subject='Your order has been edited',
		)


	def test_removing_all_pieces_doesnt_send_admin_edit_email(self):
		response = self._remove_pieces_from_order(LoginDetails.NONSTAFF)
		subject = \
			self._get_expected_admin_edit_notification_email_subject()

		self._check_outbox_doesnt_contain_message(
			recipient_address=CT_ADMIN_EMAIL,
			subject=subject,
		)

		

class OrderAppendViewTest(
	OrderEditViewTestCommon,
	TestCase,
):

	def setUp(self):
		super().setUp()
		self._init_basket_with_pieces(user=self._nonstaff_user)


	def _perform_edit(self, login_details=None, order_pk=None, **kwargs):
		'''
		Called by OrderEditViewTestCommon superclass
		'''
		return self._append_basket_to_order(
			login_details,
			order_pk,
			**kwargs,
		)


	@logged_in
	def _append_basket_to_order(self, order_pk=None, **kwargs):
		request_data = {
			'nonce': 'fake-valid-nonce',
			'new_total_balance': 
				self._total_balance_with_extra_pieces(),
		}
		request_data.update(kwargs)

		return self._client.put(
			self._get_append_to_order_url(order_pk),
			request_data,
			format='json',
		)


	def _total_balance_with_extra_pieces(self):
		return self._order.total_balance \
			+ self._basket.get_total_balance()


	def _get_append_to_order_url(self, pk=None):
		return urlresolvers.reverse(
			'append_to_order',
			kwargs={'pk': pk or self._order.pk},
		)


	def _check_response_for_successful_edit(self):
		'''
		Called by superclass after each test_can_edit_own_[x]_order
		'''
		self._check_response_includes_all_pieces()


	def _check_response_includes_all_pieces(self):
		piece_pks_from_response = self._get_piece_pks_from_response()

		for piece in Piece.objects.all():
			self.assertTrue(piece.pk in piece_pks_from_response)


	def test_can_edit_own_guest_order(self):
		self._assign_basket_to_guest()
		super().test_can_edit_own_guest_order()


	def _assign_basket_to_guest(self):
		Basket.objects.update(
			user=None,
			session_key=self._get_session_key(),
		)


	def test_cant_edit_other_guest_order(self):
		self._assign_basket_to_guest()
		super().test_cant_edit_other_guest_order()


	def test_can_edit_other_order_as_staff(self):
		Basket.objects.update(user=self._staff_user)
		super().test_can_edit_other_order_as_staff()


	def test_cant_append_empty_basket(self):
		Piece.objects.update(basket=None)
		self._check_append_returns_bad_request_error()


	def _check_append_returns_bad_request_error(self):
		response = self._append_basket_to_order(LoginDetails.NONSTAFF)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_append_expired_basket(self):
		Basket.objects.update(last_updated=ancient_time())
		self._check_append_returns_bad_request_error()


	def test_appending_increases_total_balance(self):
		expected_total_balance = self._total_balance_with_extra_pieces()
		response = self._append_basket_to_order(LoginDetails.NONSTAFF)

		self.assertEqual(
			Decimal(response.data['total_balance']),
			expected_total_balance,
		)



class OrderPlaceViewTest(
	OrderViewTestCommon,
	TestCase,
):

	def setUp(self):
		super().setUp()
		self._init_order_with_pieces(
			session_key=self._get_session_key(),
			**self.fields.initial,
		)


	def test_can_place_order_with_valid_nonce(self):
		response = self._place_order()

		self.assertEqual(
			response.status_code,
			status.HTTP_200_OK,
		)

		self.assertEqual(
			response.data['status'],
			Order.OPEN,
		)

		self._order.refresh_from_db()
		self.assertTrue(self._order.braintree_transaction_id)


	@logged_in
	def _place_order(self, pk=None, **request_data):
		if pk is None:
			order = self._order
			pk = order.pk
		else:
			order = Order.objects.get(pk=pk)
		
		request_data_with_defaults = dict({
			'nonce': 'fake-valid-nonce',
			'total_balance': order.total_balance,
		}, **request_data)

		return self._client.post(
			self._get_place_order_url(pk),
			request_data_with_defaults,
			format='json',
		)


	def _get_place_order_url(self, pk=None):
		return urlresolvers.reverse(
			'place_order',
			kwargs={'pk': pk or self._order.pk},
		)


	def test_cant_place_order_with_invalid_nonce(self):
		response = self._place_order(
			nonce='bogus-nonce',
		)

		self.assertTrue(request_denied(response))


	def test_cant_place_order_with_incorrect_total_balance(self):
		wrong_balance = self._order.total_balance + 10
		response = self._place_order(total_balance=wrong_balance)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_place_empty_order(self):
		Piece.objects.update(order=None)
		response = self._place_order()

		self.assertEqual(
			response.status_code,
			status.HTTP_400_BAD_REQUEST,
		)


	def test_cant_place_already_open_order(self):
		self._check_cant_place_order_with_status(Order.OPEN)


	def _check_cant_place_order_with_status(self, order_status):
		Order.objects.update(status=order_status)
		response = self._place_order()

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_place_already_dispatched_order(self):
		self._check_cant_place_order_with_status(Order.DISPATCHED)


	def test_cant_place_another_users_order(self):
		Order.objects.update(user=self._staff_user)
		response = self._place_order(LoginDetails.NONSTAFF)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_cant_place_another_users_guest_order(self):
		Order.objects.update(session_key='incorrect_session_key')
		response = self._place_order()

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_cant_place_nonexistent_order(self):
		pk = self._get_nonexistent_order_pk()
		response = self._client.post(
			self._get_place_order_url(pk),
			data={},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


	def test_order_placement_creates_braintree_transaction(self):
		response = self._place_order()
		
		self._order.refresh_from_db()
		self._check_braintree_transaction_status_is(
			self._order.braintree_transaction_id,
			'authorized',
		)


	def test_braintree_transaction_matches_order_balance(self):
		self._place_order()
		transaction = self._get_new_braintree_transaction_from_order()
		self.assertEqual(transaction.amount, self._order.total_balance)


	def test_order_placement_sends_receipt_email(self):
		self._place_order()
		self._check_outbox_contains_message(
			recipient_address=self._order.get_email_with_name(),
			subject='Your order has been placed',
		)


	def test_order_placement_sends_admin_notification_email(self):
		self._place_order()
		self._check_outbox_contains_message(
			recipient_address=CT_ADMIN_EMAIL,
			subject='New order from ' + self.GUEST_CUSTOMER_NAME,
		)



class OrderDispatchViewTest(
	OrderViewTestCommon,
	TestCase,
):

	def setUp(self):
		super().setUp()

		self.fields.initial['status'] = Order.OPEN

		self._order = Order.objects.create(
			braintree_transaction_id=self._get_braintree_transaction_id(),
			**self.fields.initial,
		)

		Piece.objects.create(
			order=self._order,
			price=self._order.total_balance,
		)


	def test_can_dispatch_open_order(self):
		response = self._dispatch_order(LoginDetails.STAFF)
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		self.assertEqual(
			response.data['status'],
			Order.DISPATCHED,
		)


	@logged_in
	def _dispatch_order(self, total_balance=None, pk=None):
		total_balance = total_balance or self._order.total_balance

		url = urlresolvers.reverse(
			'dispatch_order',
			kwargs={'pk': pk or self._order.pk},
		)

		return self._client.post(
			url,
			{'total_balance': total_balance},
			format='json',
		)


	def test_cant_dispatch_pending_order(self):
		Order.objects.update(status=Order.PENDING)
		response = self._dispatch_order(LoginDetails.STAFF)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_dispatch_dispatched_order(self):
		Order.objects.update(status=Order.DISPATCHED)
		response = self._dispatch_order(LoginDetails.STAFF)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_dispatch_order_with_balance_mismatch(self):
		Order.objects.update(total_balance=60.)	# Different from total of piece prices
		response = self._dispatch_order(LoginDetails.STAFF)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_dispatch_nonexistent_order(self):
		response = self._dispatch_order(
			LoginDetails.STAFF,
			pk=self._get_nonexistent_order_pk(),
		)


	def test_cant_charge_incorrect_amount(self):
		response = self._dispatch_order(
			LoginDetails.STAFF,
			total_balance=self._order.total_balance + 10,
		)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_cant_dispatch_as_nonstaff(self):
		response = self._dispatch_order(LoginDetails.NONSTAFF)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_dispatch_sends_email(self):
		self._dispatch_order(LoginDetails.STAFF)
		self._check_outbox_contains_message(
			recipient_address=self._order.get_email_with_name(),
			subject='Your order has been dispatched',
		)
