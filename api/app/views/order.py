from decimal import Decimal
from smtplib import SMTPException
from contextlib import suppress

from django.http import Http404
from django.contrib.auth.models import AnonymousUser

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.serializers import ValidationError
from rest_framework.exceptions import *
from rest_framework.response import Response

import braintree

from ..models import Order, Piece, Basket
from ..serializers import OrderSerializer
from ..permissions import *
from ..email import *
from . import OwnerSensitiveListViewMixin, SessionSensitiveViewMixin

from django_config.settings import *
from ..utils import piece_price_sum



def get_braintree_environment():
	return (
		braintree.Environment.Production
		if BRAINTREE_USE_PRODUCTION_ENVIRONMENT
		else braintree.Environment.Sandbox
	)


braintree.Configuration.configure(
	get_braintree_environment(),
	BRAINTREE_MERCHANT_ID,
	BRAINTREE_PUBLIC_KEY,
	BRAINTREE_PRIVATE_KEY,
)



class TransactionVoidFailed(APIException):

	status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
	default_detail = 'Could not void Braintree transaction'
	default_code = 'transaction_void_failed'




class OrderViewCommon:

	queryset = Order.objects.all()
	serializer_class = OrderSerializer
	permission_classes = (OrderPermission,)



class OrderListView(
	OrderViewCommon,
	OwnerSensitiveListViewMixin,
	generics.ListCreateAPIView,
):
	
	def create(self, request, *args, **kwargs):
		response = super().create(request, *args, **kwargs)

		request.session['braintree_client_token'] = \
			braintree.ClientToken.generate()

		return response



class TransactionHandlerMixin:
	'''
	Needs a self._order object.
	'''


	CANCELLATION_EMAIL_CLASSES = [
		CancelEmailMessage,
		AdminCancelNotificationEmailMessage,
	]


	def _send_emails(self, *email_classes):
		for email_class in email_classes:
			with suppress(SMTPException):  # Not the end of the world if it fails to send
				message = email_class(self._order)
				message.send()


	def _cancel_transaction(self):
		try:
			if self._order.status == Order.OPEN:
				result = self._void_transaction()
			elif self._order.status == Order.DISPATCHED:
				result = self._refund_transaction()
			else:
				return
		except:
			raise TransactionVoidFailed()

		if not result.is_success:
			raise TransactionVoidFailed()


	def _void_transaction(self):
		return braintree.Transaction.void(
			self._order.braintree_transaction_id,
		)


	def _refund_transaction(self):
		refund_result = braintree.Transaction.refund(
			self._order.braintree_transaction_id,
		)

		if not refund_result.is_success:
			return self._void_transaction()

		return refund_result



class OrderDetailView(
	TransactionHandlerMixin,
	OrderViewCommon,
	generics.RetrieveUpdateDestroyAPIView,
):
	
	def perform_destroy(self, instance):
		self._order = instance

		if not self.request.user.is_staff:
			self._check_order_is_not_dispatched()

		if instance.braintree_transaction_id:
			self._cancel_transaction()

		if instance.status == Order.DISPATCHED:
			email_classes = [RefundEmailMessage]
		else:
			email_classes = self.CANCELLATION_EMAIL_CLASSES

		self._send_emails(*email_classes)

		super().perform_destroy(instance)


	def _check_order_is_not_dispatched(self):
		if self._order.status == Order.DISPATCHED:
			raise PermissionDenied(
				'Cannot cancel an already-dispatched order',
			)



class OrderOperationViewBase(
	APIView,
	SessionSensitiveViewMixin,
	TransactionHandlerMixin,
):
	'''
	For order views aside from the usual create/retrieve/update/destroy
	'''

	total_balance_field_name_in_request = 'total_balance'


	def _init_order(self):
		try:
			self._order = Order.objects.get(pk=self.kwargs['pk'])
		except Order.DoesNotExist:
			raise Http404('Order not found')


	def _authenticate_user(self):
		if not is_made_by_owner_or_staff(self.request, self._order):
			raise PermissionDenied('Not your order')


	def _total_balance_is_valid(self):
		return float(self.request.data.get('total_balance')) \
			== float(self._order.total_balance)


	def _sale(self):
		amount = self._get_total_balance_from_request()

		return braintree.Transaction.sale({
			'amount': amount,
			'payment_method_nonce': self.request.data['nonce'],
			'options': {
				'submit_for_settlement': False,
			},
		})


	def _get_total_balance_from_request(self):
		return self._get_string_from_decimal_in_request(
			self.total_balance_field_name_in_request,
		)


	def _get_string_from_decimal_in_request(self, key):
		'''
		Could be a string, could be a float; this makes sure it's a string.
		'''
		value = self.request.data[key]

		if isinstance(value, str):
			return value

		if isinstance(value, float):
			return '%.2f' % value

		return str(value)


	def _response(self):
		serializer = OrderSerializer(
			self._order,
			context={'request': self.request},
		)

		return Response(serializer.data)



class OrderPlaceView(OrderOperationViewBase):

	def post(self, request, *args, **kwargs):
		self._init_order()
		self._authenticate_user()
		self._check_request_data()
		
		sale_result = self._sale()
		if not sale_result.is_success:
			raise NotAuthenticated(sale_result.message)

		self._order.status = Order.OPEN
		self._order.braintree_transaction_id = sale_result.transaction.id
		self._order.save()

		self._send_emails(
			ReceiptEmailMessage,
			AdminOrderNotificationEmailMessage,
		)

		return self._response()


	def _init_order(self):
		super()._init_order()

		if self._order.status != Order.PENDING:
			raise ValidationError(
				'Order must have status %i (pending) to be placed'
				% Order.PENDING,
			)

		if not self._order.pieces.count():
			raise ValidationError(
				'Cannot place an empty order',
			)


	def _check_request_data(self):
		if not self.request.data.get('nonce'):
			raise ValidationError('No nonce')

		if not self.request.data.get('total_balance'):
			raise ValidationError('No total balance')

		if not self._total_balance_is_valid():
			raise ValidationError('Invalid total balance')



class OrderDispatchView(OrderOperationViewBase):

	def post(self, request, *args, **kwargs):
		if not request.user.is_staff:
			raise PermissionDenied('Must be staff')

		self._init_order()
		self._check_requested_charge_amount()

		submission_result = self._submit_for_settlement()
		if not submission_result.is_success:
			raise NotAuthenticated(submission_result.message)

		self._order.status = Order.DISPATCHED
		self._order.save()

		self._send_emails(DispatchEmailMessage)

		return self._response()


	def _init_order(self):
		super()._init_order()

		if self._order.status != Order.OPEN:
			raise ValidationError(
				'Order status must be %i (open) to be charged'
				% Order.OPEN,
			)

		if not self._order.total_balance_matches_pieces():
			raise ValidationError(
				'Order\'s recorded total balance of %s does not '
				'match the pieces\' total value'
				% self._order.total_balance,
			)

		if not self._order.braintree_transaction_id:
			raise ValidationError(
				'Cannot charge for order without '
				'braintree_transaction_id',
			)


	def _check_requested_charge_amount(self):
		amount = self.request.data.get('total_balance')

		if amount is None:
			raise ValidationError('No total balance')

		if float(amount) != float(self._order.total_balance):
			raise ValidationError('Incorrect total balance')


	def _submit_for_settlement(self):
		return braintree.Transaction.submit_for_settlement(
			self._order.braintree_transaction_id,
			amount=self._order.total_balance,
		)



class OrderEditViewBase(OrderOperationViewBase):
	'''
	Adding and removing of items from an order

	Subclasses must implement _check_total_balance_is_correct().
	'''

	total_balance_field_name_in_request = 'new_total_balance'
	
	email_classes = [
	]


	def _edit_order(self):
		'''
		Could be adding pieces, could be removing them; the specifics are given in whichever implementation of ._perform_edit() is called.
		'''
		self._init_order()
		self._authenticate_user()
		self._take_request_data()
		
		if self._order.status == Order.OPEN:
			self._replace_transaction()

		self._perform_edit()
		self._order.update_total_balance()

		self._send_emails(
			EditReceiptEmailMessage,
			AdminEditNotificationEmailMessage,
		)


	def _init_order(self):
		super()._init_order()

		if self._order.status == Order.DISPATCHED:
			raise ValidationError(
				'Cannot edit an already-dispatched order',
			)


	def _take_request_data(self):
		self._nonce = self.request.data.get('nonce')
		if not self._nonce:
			raise ValidationError('No payment nonce')

		self._requested_total_balance = \
			self.request.data.get('new_total_balance')
		if self._requested_total_balance is None:
			raise ValidationError('No total balance')

		self._check_total_balance_is_correct()


	def _get_email_classes(self):
		return [
			EditReceiptEmailMessage,
			AdminEditNotificationEmailMessage,
		]

	def _replace_transaction(self):
		new_sale_result = self._sale()
		if not new_sale_result.is_success:
			raise NotAuthenticated(new_sale_result.message)

		self._void_transaction()	# the old one

		self._order.braintree_transaction_id = \
			new_sale_result.transaction.id



class AllPiecesAreBeingRemoved(Exception):
	pass



class OrderPieceRemovalView(OrderEditViewBase):

	def put(self, request, *args, **kwargs):
		try:
			self._edit_order()
		except AllPiecesAreBeingRemoved:
			self._send_emails(*self.CANCELLATION_EMAIL_CLASSES)
			self._cancel_transaction()
			return self._order_deletion_response()

		self._order.save()
		return self._response()


	def _take_request_data(self):
		self._marked_piece_pks = set(self.request.data.get('pieces'))
		if not self._marked_piece_pks:
			raise ValidationError('No pieces')

		self._validate_marked_pieces()

		super()._take_request_data()


	def _validate_marked_pieces(self):
		order_piece_pks = set(
			self._order.pieces.values_list('id', flat=True),
		)

		invalid_marked_pks = self._marked_piece_pks - order_piece_pks

		if invalid_marked_pks:
			raise ValidationError(
				'These pieces are not in this order: '
				+ str(invalid_marked_pks),
			)

		if self._marked_piece_pks == order_piece_pks:
			raise AllPiecesAreBeingRemoved()

	
	def _check_total_balance_is_correct(self):
		actual_total_balance = self._get_actual_total_balance()
		if actual_total_balance	!= self._requested_total_balance:
			raise ValidationError(
				'Total balance is incorrect; should be %s'
				% actual_total_balance,
			)


	def _get_actual_total_balance(self):
		remaining_order_pieces = self._order.pieces.exclude(
			pk__in=self._marked_piece_pks,
		)

		return float(
			piece_price_sum(remaining_order_pieces),
		)


	def _perform_edit(self):
		self._remove_pieces_from_order()


	def _remove_pieces_from_order(self):
		pieces = Piece.objects.filter(
			pk__in=self._marked_piece_pks,
		)
		pieces.update(order=None)


	def _order_deletion_response(self):
		self._order.delete()
		return Response(status=status.HTTP_204_NO_CONTENT)



class OrderAppendView(OrderEditViewBase):
	'''
	Adds the current contents of the user's basket to the specified order
	'''

	def put(self, request, *args, **kwargs):
		self._edit_order()
		self._order.save()
		return self._response()


	def _take_request_data(self):
		self._init_basket()
		super()._take_request_data()


	def _init_basket(self):
		try:
			if isinstance(self.request.user, AnonymousUser):
				self._basket = Basket.objects.get(
					session_key=self.request.session.session_key,
				)
			else:
				self._basket = self.request.user.basket
		except Basket.DoesNotExist:
			self._basket = None

		if not self._basket.has_pieces():
			raise ValidationError('Basket is empty')


	def _check_total_balance_is_correct(self):
		actual_total_balance = float(
			self._order.total_balance
			+ self._basket.get_total_balance()
		)

		if actual_total_balance != self._requested_total_balance:
			raise ValidationError(
				'Total balance is incorrect; should be %s'
				% actual_total_balance,
			)


	def _perform_edit(self):
		self._append_basket_to_order()


	def _append_basket_to_order(self):
		self._basket.pieces.update(
			basket=None,
			order=self._order,
		)
		self._basket.delete()
