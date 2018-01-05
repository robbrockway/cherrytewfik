from datetime import datetime
from contextlib import suppress

from django.http import Http404
from django.contrib.auth.models import AnonymousUser

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import *
from rest_framework.permissions import IsAdminUser

from ..models import Basket, Piece
from ..serializers import BasketSerializer
from ..permissions import *
from . import SessionSensitiveViewMixin



class BasketViewCommon:

	queryset = Basket.objects.all()
	serializer_class = BasketSerializer



class BasketListView(
	BasketViewCommon,
	generics.ListCreateAPIView,
):

	permission_classes = (IsAdminUser,)


	def perform_create(self, serializer):
		serializer.save()



class BasketDetailView(
	BasketViewCommon,
	SessionSensitiveViewMixin, 
	generics.RetrieveUpdateDestroyAPIView,
):

	permission_classes = (OwnerCanRetrieveAndDestroy,)


	def get_object(self):
		if self.kwargs['pk'] == 'own':
			return self._get_own_basket()

		return super().get_object()


	def _get_own_basket(self):
		with suppress(Basket.DoesNotExist):
			if isinstance(self.request.user, AnonymousUser):
				return Basket.objects.get(
					session_key=self._get_session_key(),
				)
			else:
				return Basket.objects.get(user=self.request.user)
		



PIECE_NOT_FOUND_MESSAGE = 'Piece does not exist'
PIECE_ALREADY_RESERVED_MESSAGE = 'Piece is already reserved'
PIECE_NOT_IN_BASKET_MESSAGE = 'Piece is not in basket'



class PieceNotInBasket(APIException):

	status_code = 500
	default_detail = PIECE_NOT_IN_BASKET_MESSAGE
	default_code = 'piece_not_in_basket'



class BasketOperationViewBase(
	SessionSensitiveViewMixin,
	APIView,
):

	def _basket_response(self):
		serializer = BasketSerializer(
			self._basket,
			context={'request': self.request},
		)

		return Response(serializer.data)



class AddPieceToBasketView(BasketOperationViewBase):
	
	def put(self, request, *args, **kwargs):
		try:
			self._init_piece()
			self._basket = self._get_basket(request.user)
			self._check_piece_is_available()
			self._piece.basket = self._basket
			self._piece.save()
			return self._basket_response()
		except Piece.DoesNotExist:
			raise Http404(PIECE_NOT_FOUND_MESSAGE)


	def _init_piece(self):
		self._piece = Piece.objects.get(pk=self.kwargs['pk'])
		if not self._piece.price:
			raise ValidationError('Piece is not for sale')


	def _get_basket(self, user):
		basket_params = (
			{'session_key': self._get_session_key()}
			if isinstance(self.request.user, AnonymousUser) 
			else {'user': user}
		)

		try:
			basket = Basket.objects.get(**basket_params)
			basket.empty_if_expired()
			basket.last_updated = datetime.now()
			basket.save()
		except Basket.DoesNotExist:
			basket = Basket.objects.create(**basket_params)

		return basket


	def _check_piece_is_available(self):
		if self._piece.basket and self._piece.basket != self._basket \
				or self._piece.order:
			raise PermissionDenied(PIECE_ALREADY_RESERVED_MESSAGE)



class RemovePieceFromBasketView(BasketOperationViewBase):

	def put(self, request, *args, **kwargs):
		try:
			self._piece = Piece.objects.get(pk=self.kwargs['pk'])
			self._basket = self._get_basket()
			self._try_removal()
			return self._basket_response()
		except Piece.DoesNotExist:
			raise Http404(PIECE_NOT_FOUND_MESSAGE)
		except PieceNotInBasket:
			raise PermissionDenied('Piece is not in this basket')


	def _get_basket(self):
		if isinstance(self.request.user, AnonymousUser):
			return self._get_basket_by_session_key()

		return self._get_basket_by_user()


	def _get_basket_by_session_key(self):
		try:
			return Basket.objects.get(
				user=None,
				session_key=self._get_session_key()
			)
		except Basket.DoesNotExist:
			raise PieceNotInBasket()


	def _get_basket_by_user(self):
		if not getattr(self.request.user, 'basket', None):
			raise PieceNotInBasket()

		return self.request.user.basket
	

	def _try_removal(self):
		self._check_piece_is_in_basket()

		self._piece.basket = None
		self._piece.save()

		self._delete_basket_if_empty()


	def _check_piece_is_in_basket(self):
		if self._piece.basket != self._basket:
			raise PieceNotInBasket()


	def _delete_basket_if_empty(self):
		if not self._basket.pieces:
			self._basket.delete()
