from django.contrib.auth.models import User, AnonymousUser
from django.contrib.auth.hashers import make_password

from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
import rest_framework.fields

from .models import *
from .fields.multisize_image import *
from .fields.exhibition_datetime import *
from .fields.address import *



class SerializerBase(serializers.ModelSerializer):

	serializer_field_mapping = dict(
		serializers.ModelSerializer.serializer_field_mapping,
	)

	serializer_field_mapping.update({
		MultisizeImageField: MultisizeImageSerializerField,
		ExhibitionDateTimeField: ExhibitionDateTimeSerializerField,
	})
	

	def serializer_field_to_model_field(self, serializer_field):
		model_fields = self.Meta.model._meta.get_fields()
		
		for model_field in model_fields:
			if model_field.name == serializer_field.source:
				return model_field
		
		return None


	def get_user_from_request(self):
		request = self.context.get('request')
		if not request:
			return None

		return request.user


	def get_session_key_from_request(self):
		request = self.context.get('request')
		if not request:
			return None

		session = request.session

		if not session.session_key:
			session.save()

		return session.session_key



PIECE_FIELDS = (
	'id',
	'name',
	'date',
	'price',
	'description',
	'image',
	'category',
	'index_in_cat',
	'basket',
	'order',
)


class PieceSerializer(SerializerBase):	

	class Meta:
		model = Piece
		fields = PIECE_FIELDS



class BasketSerializer(SerializerBase):

	pieces = PieceSerializer(many=True, read_only=True)


	def to_representation(self, basket):
		if not self._is_viewed_by_owner(basket):
			return self._to_public_representation(basket)

		return super().to_representation(basket)


	def _is_viewed_by_owner(self, basket):
		if 'request' not in self.context:
			return False

		request = self.context['request']
		return self._request_matches_basket_user(basket) \
			or self._request_matches_basket_session_key(basket)
			

	def _request_matches_basket_user(self, basket):
		request = self.context['request']
		return request.user is not None \
			and request.user == basket.user


	def _request_matches_basket_session_key(self, basket):
		request = self.context['request']
		return basket.session_key is not None \
			and basket.session_key == request.session.session_key


	def _to_public_representation(self, basket):
		last_updated_str = \
			self.fields['last_updated'].to_representation(
				basket.last_updated,
			)

		return {'last_updated': last_updated_str}


	class Meta:
		model = Basket
		fields = (
			'id',
			'user',
			'last_updated',
			'pieces',
		)



class EmbeddedBasketSerializer(BasketSerializer):

	class Meta:
		model = Basket
		fields = (
			'id',
			'user',
			'last_updated',
		)
		


class OrderStatusValidator:

	def __call__(self, status):
		self.new_status = status

		if self._is_empty_order_no_longer_pending():
			raise serializers.ValidationError(
				'Status must remain 0 (pending) while order is empty',
			)


	def _is_empty_order_no_longer_pending(self):
		return self.new_status != Order.PENDING \
			and not self._order_has_pieces()


	def _order_has_pieces(self):
		return bool(
			Piece.objects.filter(order=self.order),
		)


	def set_context(self, status_field):
		self.order = status_field.parent.instance
			


class MustBeStaffToWriteFields:
	'''
	Validator for a whole serializer; takes one or more field names in its constructor to protect against non-staff writing
	'''

	def __init__(self, *field_names):
		self._staff_only_field_names = set(field_names)


	def __call__(self, dict):
		if self._is_staff:
			return

		illegal_field_names = self._staff_only_field_names_in_dict(dict)
		if illegal_field_names:
			raise PermissionDenied(
				'Must be staff to set ' + ', '.join(illegal_field_names),
			)


	def _staff_only_field_names_in_dict(self, dict):
		dict_keys = set(dict)
		return self._staff_only_field_names.intersection(dict_keys)


	def set_context(self, serializer):
		user = serializer.get_user_from_request()
		self._is_staff = bool(user) and user.is_staff



class OrderSerializer(SerializerBase):

	pieces = PieceSerializer(many=True, read_only=True)
	address = AddressSerializerField()

	EMPTY_BASKET_ERROR = serializers.ValidationError(
		'Cannot create order using empty basket',
	)


	def create(self, validated_data):
		'''
		Automatic filling of various empty fields when an order is placed
		'''
		user = validated_data.get('user') \
			or self._get_user()

		basket = self._get_nonempty_basket(user)

		validated_data['user'] = user
		self._check_for_user_or_email(validated_data)

		if not user:
			validated_data['session_key'] = \
				self.get_session_key_from_request()

		validated_data['recipient_name'] = (
			validated_data.get('recipient_name')
			or self._create_recipient_name(user)
		)

		validated_data['total_balance'] = (
			validated_data.get('total_balance')
			or basket.get_total_balance()
		)

		order = super().create(validated_data)
		self._move_pieces_from_basket_to_order(basket, order)
		return order


	def _get_user(self):
		user = self.get_user_from_request()
		if isinstance(user, AnonymousUser):
			return None
		
		return user


	def _create_recipient_name(self, user):
		if user is None:
			raise ValidationError(
				'Recipient name required if user is not logged in',
			)

		return ' '.join([user.first_name, user.last_name])

	
	def _get_nonempty_basket(self, user):
		basket = self._get_basket(user)

		if not basket.has_pieces():
			raise self.EMPTY_BASKET_ERROR

		return basket


	def _get_basket(self, user):
		if user is None:
			return self._get_basket_for_session_key()

		try:
			return user.basket
		except Basket.DoesNotExist:
			raise self.EMPTY_BASKET_ERROR


	def _get_basket_for_session_key(self):
		try:
			return Basket.objects.get(
				session_key=self.get_session_key_from_request()
			)
		except Basket.DoesNotExist:
			raise self.EMPTY_BASKET_ERROR


	def _check_for_user_or_email(self, dict):
		if not (dict.get('user') or dict.get('email')):
			raise serializers.ValidationError(
				'Must have user or email address specified',
			)


	def _move_pieces_from_basket_to_order(self, basket, order):
		pieces = Piece.objects.filter(basket=basket)
		pieces.update(basket=None, order=order)


	def _is_viewed_by_owner_or_staff(self, order):
		user = self.get_user_from_request()
		return user.is_staff \
			or user is not None \
				and user == order.user


	class Meta:
		model = Order
		fields = (
			'id',
			'user',
			'session_key',
			'email',
			'customer_name',
			'recipient_name',
			'address',
			'datetime',
			'status',
			'total_balance',
			'pieces',
		)

		validators = [
			MustBeStaffToWriteFields(
				'id',
				'user',
				'session_key',
				'datetime',
				'status',
				'total_balance',
			),
		]

		extra_kwargs = {
			'status': {'validators': [OrderStatusValidator()]},
			'recipient_name': {'required': False},
			'total_balance': {'required': False},
		}



class EmbeddedOrderSerializer(OrderSerializer):
	'''
	Serialises to an empty dictionary when not viewed by owner or staff, for embedding inside serialised Pieces
	'''

	def to_representation(self, order):
		if self._is_viewed_by_owner_or_staff(order):
			return super().to_representation(order)

		return {}


	class Meta(OrderSerializer.Meta):
		pass



class PieceSerializerWithBasketAndOrder(SerializerBase):

	basket = EmbeddedBasketSerializer(read_only=True)
	order = EmbeddedOrderSerializer(read_only=True)


	class Meta(PieceSerializer.Meta):
		pass



class CategorySerializer(SerializerBase):

	pieces = PieceSerializerWithBasketAndOrder(many=True, read_only=True)


	class Meta:
		model = Category
		fields = (
			'id',
			'name',
			'description',
			'pieces',
		)



class PieceSerializerWithCategory(PieceSerializerWithBasketAndOrder):

	category = CategorySerializer(read_only=True)


	class Meta(PieceSerializerWithBasketAndOrder.Meta):
		pass



class ExhibitionSerializer(SerializerBase):

	class Meta:
		model = Exhibition
		fields = (
			'id',
			'name',
			'url',
			'location',
			'location_url',
			'facebook_url',
			'description',
			'image',
			'datetime',
		)



class CommentSerializer(SerializerBase):

	def create(self, validated_data):
		validated_data['user'] = (
			validated_data.get('user')
			or self._get_logged_in_user()
		)

		return super().create(validated_data)


	def _get_logged_in_user(self):
		user = self.get_user_from_request()
		if not isinstance(user, AnonymousUser):
			return user


	class Meta:
		model = Comment

		fields = (
			'id',
			'name',
			'user',
			'datetime',
			'comment',
			'piece',
			'category',
		)



class StringTableSerializer(SerializerBase):

	class Meta:
		model = String
		fields = ('key', 'value')



class HasUserOrEmail:
	'''
	Validator for OrderSerializer
	'''

	def __call__(self, dict):
		self._dict = dict

		for field_name in ('user', 'email'):
			if self._field_is_set(field_name):
				return

		raise serializers.ValidationError('Order must have user or email field set')


	def _field_is_set(self, field_name):
		if field_name in self._dict:
			return self._field_is_now_set(field_name)

		return self._field_is_already_set(field_name)


	def _field_is_now_set(self, field_name):
		return bool(self._dict.get(field_name))


	def _field_is_already_set(self, field_name):
		return bool(
			getattr(self.order, field_name, None),
		)


	def set_context(self, order_serializer):
		self.order = order_serializer.instance



class EmailChangeSerializer(SerializerBase):
	
	class Meta:
		model = EmailChange
		fields = (
			'id',
			'user',
			'new_email',
		)



class UserSerializer(SerializerBase):

	email = rest_framework.fields.EmailField(allow_blank=False)
	basket = BasketSerializer(read_only=True)
	email_change = EmailChangeSerializer(read_only=True)

	class Meta:
		model = User
		fields = (
			'id',
			'username',
			'first_name',
			'last_name',
			'email',
			'is_staff',
			'basket',
			'email_change',
		)



def check_email_address_is_available(email_address):
	for cls in [User, PendingUser]:
		try:
			full_user = cls.objects.get(email=email_address)
			raise serializers.ValidationError(
				'%s is already taken' % email_address,
			)
		except cls.DoesNotExist:
			pass



class PendingUserSerializer(SerializerBase):

	email = rest_framework.fields.EmailField(
		validators=[check_email_address_is_available],
	)


	def create(self, validated_data):
		return PendingUser.objects.create(**validated_data)


	def update(self, instance, validated_data):
		validated_data['password'] = \
			make_password(validated_data['password'])

		return super().update(instance, validated_data)

	
	class Meta:
		model = PendingUser

		fields = (
			'id',
			'first_name',
			'last_name',
			'email',
			'password',
		)

		extra_kwargs = {
			'first_name': {'required': True},
			'last_name': {'required': True},
			'email': {'required': True},
			'password': {'write_only': True, 'required': True},
		}



class PasswordResetSerializer(SerializerBase):

	email = rest_framework.fields.EmailField(required=False)


	def create(self, validated_data):
		try:
			return PasswordReset.objects.create(**validated_data)
		except User.DoesNotExist:
			raise ValidationError('User does not exist')


	class Meta:
		model = PasswordReset
		
		fields = (
			'id',
			'user',
			'email',
		)

		extra_kwargs = {
			'email': {'write_only': True},
			'user': {'required': False},
		}




class AddressSerializer(SerializerBase):

	def create(self, validated_data):
		if not any(key in validated_data for key in ('user', 'ip')):
			validated_data.update(self._user_or_session_data())

		return super().create(validated_data)


	def _user_or_session_data(self):
		request = self.context.get('request')
		if not request:
			return {}

		if isinstance(request.user, AnonymousUser):
			return {'session_key': self.get_session_key_from_request()}

		return {'user': request.user}


	class Meta:
		model = Address

		fields = (
			'id',
			'address',
			'user',
			'session_key',
		)

