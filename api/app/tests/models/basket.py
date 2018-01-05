from datetime import datetime

from django.contrib.auth.models import User
from django.utils import timezone
from django.test import TestCase

from app.models import Basket, Piece, Order
from .modeltest_base import *
from .. import logged_in, ancient_time, is_in_last_minute



class BasketTestCommon:

	TEST_CREDENTIALS = {
		'username': 'test',
		'password': 'testymctestface',
	}


	@classmethod
	def _init_params(cls):
		cls.fields = ModelTestFields()

		cls._test_user = User.objects.create_user(**cls.TEST_CREDENTIALS)

		cls.fields.initial = {
			'user': cls._test_user.pk,
			'last_updated': 
				datetime(2014, 2, 1),
		}

		cls.fields.changed = {
			'user': None,
			'last_updated':
				datetime.now(),
		}

		cls.model_class = Basket



class BasketTest(BasketTestCommon, ModelTestBase, TestCase):
	
	@classmethod
	def _init_params(cls):
		super()._init_params()

		# Use a User instance rather than just a PK, since we're creating baskets directly here, not via HTTP
		cls.fields.initial['user'] = cls._test_user


	def test_has_pieces_positive_case(self):
		self._create_piece_for_basket()
		self._make_basket_current()
		self.assertTrue(self._object.has_pieces())


	def _create_piece_for_basket(self):
		Piece.objects.create(basket=self._object)


	def _make_basket_current(self):
		self._object.last_updated = datetime.now()
		self._object.save()


	def test_has_pieces_returns_false_for_empty_basket(self):
		self._make_basket_current()
		self.assertFalse(self._object.has_pieces())


	def test_has_pieces_returns_false_for_expired_basket(self):
		self._create_piece_for_basket()
		self.assertFalse(self._object.has_pieces())


	def test_empty_if_expired_positive_case(self):
		self._create_piece_for_basket()
		self._object.empty_if_expired()
		self.assertFalse(self._object.pieces.count())


	def test_empty_if_expired_negative_case(self):
		self._create_piece_for_basket()
		self._make_basket_current()
		self._object.empty_if_expired()
		self.assertTrue(self._object.pieces.count())



TEST_PIECE_NAME = 'Test piece'



class BasketViewTest(BasketTestCommon, ModelViewTestBase, TestCase):
	
	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.list_view_name = 'basket_list'
		cls.detail_view_name = 'basket_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_ONLY


	def test_add_to_basket(self):
		self._check_can_add_new_piece_to_basket(LoginDetails.NONSTAFF)

		self.assertEqual(
			self._response.data['user'],
			self._nonstaff_user.pk,
		)


	def _check_can_add_new_piece_to_basket(self, login_details=None):
		piece = self._create_piece()
		self._response = self._add_piece_to_basket(login_details, piece)

		self.assertContains(
			self._response,
			TEST_PIECE_NAME,
			status_code=status.HTTP_200_OK,
		)

		piece.refresh_from_db()
		self._check_response_object_id_is(piece.basket.pk)


	def _create_piece(self, **fields):
		fields = dict({
			'name': TEST_PIECE_NAME,
			'price': 25.,
		}, **fields)

		return Piece.objects.create(**fields)


	@logged_in
	def _add_piece_to_basket(self, piece):
		return self._client.put(
			self._get_add_to_basket_url(piece),
			data=None,
		)


	def _get_add_to_basket_url(self, piece):
		return urlresolvers.reverse(
			'add_to_basket',
			kwargs={'pk': piece.pk},
		)


	def test_can_add_piece_to_guest_basket(self):
		self._check_can_add_new_piece_to_basket()


	def test_cant_add_piece_to_basket_without_price(self):
		piece = self._create_piece(price=None)
		response = self._add_piece_to_basket(LoginDetails.NONSTAFF, piece)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


	def test_basket_refreshes_last_updated_time_on_add(self):
		self._make_basket_expired()

		self._response = self._add_piece_to_basket(
			LoginDetails.NONSTAFF,
			piece=self._create_piece(),
		)

		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._check_basket_in_response_was_last_updated_within_minute()


	def _make_basket_expired(self):
		Basket.objects.update(
			user=self._nonstaff_user,
			last_updated=ancient_time(),
		)


	def _check_basket_in_response_was_last_updated_within_minute(self):
		self.assertTrue('last_updated' in self._response.data)
		last_updated_string_without_fraction = \
			self._response.data['last_updated'].split('.')[0]

		last_updated = datetime.strptime(
			last_updated_string_without_fraction,
			DATETIME_RESPONSE_FORMAT,
		)

		self.assertTrue(is_in_last_minute(last_updated))


	def test_adding_to_expired_basket_removes_old_pieces(self):
		self._make_basket_expired()
		basket = Basket.objects.first()

		old_pieces = [
			self._create_piece(basket=basket)
			for i in range(5)
		]

		new_piece = self._create_piece()

		response = self._add_piece_to_basket(
			LoginDetails.NONSTAFF,
			piece=new_piece,
		)

		piece_pks_from_response = [
			piece_dict['id'] for piece_dict in response.data['pieces']
		]

		self.assertFalse(any(
			piece.pk in piece_pks_from_response
			for piece in old_pieces
		))

		self.assertTrue(new_piece.pk in piece_pks_from_response)


	def test_cant_add_reserved_piece_to_basket(self):
		piece = self._create_reserved_piece_for_user(self._staff_user)
		self._response = \
			self._add_piece_to_basket(LoginDetails.NONSTAFF, piece)

		self.assertContains(
			self._response,
			'already reserved',
			status_code=status.HTTP_403_FORBIDDEN,
		)


	def _create_reserved_piece_for_user(
		self,
		user=None,
		session_key='',
	):
		other_basket = Basket.objects.create(
			user=user,
			session_key=session_key,
		)

		return self._create_piece(basket=other_basket)


	def test_cant_add_ordered_piece_to_basket(self):
		piece = self._create_ordered_piece()
		response = self._add_piece_to_basket(LoginDetails.NONSTAFF, piece)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def _create_ordered_piece(self):
		order = Order.objects.create(total_balance=0)
		return self._create_piece(order=order)


	def test_can_remove_from_own_basket(self):
		piece = self._create_reserved_piece_for_user(self._nonstaff_user)
		self._check_can_remove_piece_from_basket(LoginDetails.NONSTAFF, piece)


	def _check_can_remove_piece_from_basket(
		self,
		login_details,
		piece,
	):
		self._remove_piece_from_basket(login_details, piece)
		self._check_response_object_id_is(piece.basket.pk)
		self._check_response_basket_is_empty()


	@logged_in
	def _remove_piece_from_basket(self, piece):
		self._response = self._client.put(
			self._get_remove_from_basket_url(piece),
			data=None,
		)


	def _check_response_basket_is_empty(self):
		self.assertTrue('pieces' in self._response.data)
		self.assertFalse(self._response.data['pieces'])


	def _get_remove_from_basket_url(self, piece):
		return urlresolvers.reverse(
			'remove_from_basket',
			kwargs={'pk': piece.pk},
		)


	def test_cant_remove_from_other_basket(self):
		piece = self._create_reserved_piece_for_user(self._staff_user)
		self._check_cant_remove_piece_from_basket(LoginDetails.NONSTAFF, piece)


	def _check_cant_remove_piece_from_basket(
		self,
		login_details,
		piece,
	):
		initial_basket = piece.basket
		self._remove_piece_from_basket(login_details, piece)

		self.assertTrue(request_denied(self._response))
		
		piece.refresh_from_db()
		self.assertEqual(initial_basket, piece.basket)


	def test_can_remove_from_own_guest_basket(self):
		piece = self._create_reserved_piece_for_user(
			session_key=self._get_session_key(),
		)
		
		self._check_can_remove_piece_from_basket(
			login_details=None,
			piece=piece,
		)


	def test_cant_remove_from_other_guest_basket(self):
		piece = self._create_reserved_piece_for_user(
			session_key='other_session_key',
		)

		self._check_cant_remove_piece_from_basket(
			login_details=None,
			piece=piece,
		)


	def test_can_view_own_basket(self):
		self._check_can_view_basket(self.TEST_CREDENTIALS)


	def _check_can_view_basket(self, login_details=None, pk='own'):
		self._response = self._retrieve_object(login_details, pk=pk)
		self._check_response_for_basket_fields()


	def _check_response_for_basket_fields(self):
		self.assertTrue(all(
			field in self._response.data for field in ['pieces', 'user', 'id']
		))


	def test_cant_view_other_basket(self):
		basket = Basket.objects.first()

		self._check_cant_view_basket(
			LoginDetails.NONSTAFF,
			basket.pk,
		)


	def _check_cant_view_basket(self, login_details=None, pk='own'):
		self._response = self._retrieve_object(login_details, pk=pk)
		self.assertTrue(request_denied(self._response))


	def test_can_view_own_guest_basket(self):
		Basket.objects.update(
			user=None,
			session_key=self._get_session_key(),
		)

		self._check_can_view_basket()


	def test_cant_view_other_guest_basket(self):
		Basket.objects.update(
			user=None,
			session_key='other_session_key',
		)

		basket = Basket.objects.first()

		self._check_cant_view_basket(
			login_details=None,
			pk=basket.pk,
		)


	def test_cant_update_basket_metadata(self):
		response = self._update_object(self.TEST_CREDENTIALS)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_can_destroy_own_basket(self):
		response = self._destroy_object(self.TEST_CREDENTIALS)
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


	def test_cant_destroy_other_basket(self):
		response = self._destroy_object(LoginDetails.NONSTAFF)
		self.assertTrue(request_denied(response))
