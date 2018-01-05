import os.path
from datetime import datetime, timedelta
import random
import string
from contextlib import suppress
from smtplib import SMTPException

from django.db import IntegrityError
from django.db.models import *
from django.contrib.auth.models import User, UserManager
from django.contrib.auth.hashers import make_password, check_password
from django.dispatch import receiver
from django.template import *
from django.forms.models import model_to_dict

from rest_framework.exceptions import AuthenticationFailed, ValidationError

from .fields.multisize_image import *
from .fields.piece_date import *
from .fields.exhibition_datetime import *
from .email import TemplateEmailMessage

from django_config.settings import CT_FRONTEND_ROOT, CT_IMAGE_DIR



class ModelBase(Model):

	MAX_PK = 1000000000


	@classmethod
	def unchecked_random_pk(cls):
		return random.randint(1, cls.MAX_PK)


	def __init__(self, *args, **kwargs):
		kwargs['id'] = (
			kwargs.get('id')
			or kwargs.get('pk')
			or self._generate_pk()
		)

		super().__init__(*args, **kwargs)


	def _generate_pk(self):
		while True:
			candidate = self.unchecked_random_pk()
			try:
				prior_instance_with_pk = \
					self.__class__.objects.get(pk=candidate)
			except self.DoesNotExist:
				return candidate


	def __setattr__(self, item, value):
		# Have we just set .image = None?
		multisize_image_to_delete = \
			self._get_multisize_image_to_delete(item, value)

		if multisize_image_to_delete:
			multisize_image_to_delete.delete_files()

		super().__setattr__(item, value)


	def _get_multisize_image_to_delete(self, item, value):
		'''
		Checks for a MultisizeImageField that has just been set to None, so files can be deleted.
		'''

		for field in self._meta.fields:
			if self._multisize_image_field_matches_name(field, item) \
					and value is None:
				try:
					return getattr(self, field.name)
				except self.DoesNotExist:
					return None


	def _multisize_image_field_matches_name(self, field, name):
		return isinstance(field, MultisizeImageField) \
			and field.name == name


	def delete(self, *args, **kwargs):
		self.delete_image_files()
		super().delete(*args, **kwargs)


	def delete_image_files(self):
		for field in self._meta.fields:
			if isinstance(field, MultisizeImageField):
				multisize_image = getattr(self, field.name)
				multisize_image.delete_files()


	@classmethod
	def get_image_field(cls):
		for field in cls._meta.fields:
			if field.name == 'image':
				return field
		
		raise KeyError('No field named \'image\' in this model')


	class Meta:
		abstract = True



class NamedModel(ModelBase):

	class Meta:
		abstract = True
	
	name = CharField(max_length=255, blank=True)
	

	def __str__(self):
		return self.name



class OrderedListManager(Manager):
	'''
	For Piece and Category; ensures that new objects are created at the end of their list, unless otherwise specified.

	Subclasses must set:
	.list_index_field_name
	'''

	def create(self, **kwargs):
		if not kwargs.get(self.list_index_field_name):
			kwargs[self.list_index_field_name] = \
				self._get_next_index(**kwargs)

		return super().create(**kwargs)


	def _get_next_index(self, **creation_kwargs):
		max_index = self._get_max_index(**creation_kwargs)

		if max_index:
			return max_index + 1

		return 1


	def _get_max_index(self, **creation_kwargs):
		list = self._get_list_that_would_contain(**creation_kwargs)
		aggregate = self.aggregate(Max(self.list_index_field_name))
		return aggregate[self.list_index_field_name + '__max']


	def _get_list_that_would_contain(self, **creation_kwargs):
		'''
		Can be overridden e.g. to restrict pieces to those from the same category as is being added to
		'''
		return self.all()



class PieceManager(OrderedListManager):

	list_index_field_name = 'index_in_cat'


	def _get_list_that_would_contain(self, **creation_kwargs):
		category = creation_kwargs.get('category')
		return self.filter(category=category)



PIECE_IMAGE_ROOT = os.path.join(
	CT_IMAGE_DIR,
	'pieces',
)


class Piece(NamedModel):

	objects = PieceManager()

	date = PieceDateField(null=True)
	price = DecimalField(null=True, max_digits=6, decimal_places=2)
	description = TextField(blank=True)

	image = MultisizeImageField(
		null=True,
		widths=[
			MultisizeImage.FULL_SIZE,
			720, 360, 180,
		],
		root_dir='pieces',
	)

	category = ForeignKey(
		'Category',
		on_delete=CASCADE,
		related_name='pieces',
		null=True,
	)

	basket = ForeignKey(
		'Basket',
		on_delete=SET_NULL,
		related_name='pieces',
		null=True,
	)

	order = ForeignKey(
		'Order',
		on_delete=SET_NULL,
		related_name='pieces',
		null=True,
	)

	index_in_cat = IntegerField(null=True)

	visible = BooleanField(
		default=True,
	)


	class Meta:
		ordering = ['category', 'index_in_cat']



class CategoryManager(OrderedListManager):

	list_index_field_name = 'index_in_list'



class Category(NamedModel):

	objects = CategoryManager()

	description = TextField(blank=True)
	index_in_list = IntegerField(null=True)



class Exhibition(NamedModel):

	url = URLField(blank=True)

	image = MultisizeImageField(
		null=True,
		widths=[150, 300],
		root_dir='exhibitions',
	)

	description = TextField(blank=True)

	location = CharField(
		blank=True,
		max_length=100
	)

	location_url = URLField(blank=True)

	facebook_url = URLField(blank=True)

	datetime = ExhibitionDateTimeField(null=True)



class PieceContainer(ModelBase):
	'''
	Base class for Order and Basket, both of which 'contain' (i.e. are a ForeignKey for) a number of pieces.
	'''

	def get_total_balance(self):
		return piece_price_sum(self.pieces)


	class Meta:
		abstract = True



class Basket(PieceContainer):
	
	user = OneToOneField(
		User,
		on_delete=CASCADE,
		related_name='basket',
		null=True,
	)

	session_key = CharField(
		max_length=32,
		blank=True,
	)
	
	last_updated = DateTimeField(
		default=datetime.now,
		null=False,
	)


	def has_pieces(self):
		return bool(
			self.pieces.count()
			and self.is_current()
		)


	def is_current(self):
		return self.last_updated > \
			datetime.now() - timedelta(hours=1)


	def empty_if_expired(self):
		if not self.is_current():
			self.pieces.update(basket=None)



class Address(ModelBase):

	user = ForeignKey(
		User,
		on_delete=CASCADE,
		related_name='addresses',
		null=True,
	)

	session_key = CharField(max_length=32, blank=True)
	address = TextField(max_length=1023)



class Order(PieceContainer):

	user = ForeignKey(
		User,
		on_delete=SET_NULL,
		related_name='orders',
		null=True,
	)

	session_key = CharField(max_length=32, blank=True)

	email = EmailField(blank=True)

	customer_name = CharField(max_length=40, blank=True)

	recipient_name = CharField(max_length=40, blank=False)

	address = TextField(max_length=1023, blank=False)

	datetime = DateTimeField(
		default=datetime.now,
		null=False,
	)

	PENDING = 0
	OPEN = 1
	DISPATCHED = 2
	status = IntegerField(
		default=0,
		null=False,
	)

	total_balance = DecimalField(
		max_digits=7,
		decimal_places=2,
		null=False,
	)

	braintree_transaction_id = CharField(
		max_length=8,
		blank=True,
	)


	def get_email_with_name(self):
		return '%s <%s>' % (
			self.get_customer_name(),
			self.get_email(),
		)


	def get_customer_name(self):
		if self.user is not None:
			return ' '.join([
				self.user.first_name,
				self.user.last_name,
			])

		return self.customer_name or self.recipient_name


	def get_email(self):
		if self.user is not None:
			return self.user.email

		return self.email


	def get_address_lines(self):
		return self.address.split('\n')


	def update_total_balance(self):
		self.total_balance = self.get_total_balance()


	def total_balance_matches_pieces(self):
		return self.total_balance == self.get_total_balance()



class Comment(ModelBase):

	name = CharField(max_length=48, blank=True)
	
	user = ForeignKey(
		User,
		on_delete=CASCADE,
		related_name='comments',
		null=True,
	)

	datetime = DateTimeField(
		default=datetime.now,
		null=False,
	)

	comment = TextField(blank=False)

	piece = ForeignKey(
		Piece,
		on_delete=CASCADE,
		related_name='comments',
		null=True,
	)

	category = ForeignKey(
		Category,
		on_delete=CASCADE,
		related_name='category',
		null=True,
	)



class String(Model):

	key = CharField(max_length=32, primary_key=True)
	value = TextField(blank=True)



class ManagerWithActivationKey(Manager):
	'''
	Abstract base class. Manages models (e.g. PendingUser, EmailChange, PasswordReset) that are, at some point, 'activated' using an activation key sent to the user by email. Emails are sent by this manager.
	
	Requires:
	.template_name: filename in app/email_templates, without extension (.html or .txt added later)
	.activation_message_subject
	.activation_link_endpoint: URL, relative to site's root, for link in email, e.g. 'activateuser'
	'''

	def _generate_activation_key(self):
		key_chars = random.choices(
			string.ascii_uppercase + 
			string.ascii_lowercase + 
			string.digits,
			k=16,
		)

		return ''.join(key_chars)


	def _create_or_get_previous_object_for_user(
		self,
		user,
		fields_dict,
		activation_key
	):
		'''
		Creates a new object or, if one already exists for the given user, returns it amended with the new activation key
		'''

		try:
			object = self.get(user=user)
			for key, value in fields_dict.items():
				setattr(object, key, value)
		except self.model.DoesNotExist:
			object = self.model(
				user=user,
				**fields_dict,
			)

		object.set_activation_key(activation_key)
		object.save()
		return object


	def _send_activation_email(self, to, template_context=None):
		message = TemplateEmailMessage(
			subject=self.activation_message_subject,
			to=to,
			template_name=self.template_name,
			context=template_context,
		)

		try:
			message.send()
		except SMTPException:
			raise ValidationError('Invalid email address')


	def _default_email_template_context(self, object, activation_key):
		activation_url = '%s/%s/%i?key=%s' % (
			CT_FRONTEND_ROOT,
			self.activation_link_endpoint,
			object.pk,
			activation_key,
		)

		return {
			'user': self._get_object_owner(object),
			'activation_url': activation_url,
			'site_root': CT_FRONTEND_ROOT,
		}


	def _get_object_owner(self, object):
		default = object
		return getattr(object, 'user', default)



class PendingUserManager(ManagerWithActivationKey):

	activation_message_subject = 'Activate your account'
	template_name = 'activate_account'
	activation_link_endpoint = 'activateuser'


	def create(
		self,
		email,
		password,
		first_name,
		last_name,
	):
		pending_user = PendingUser(
			email=email,
			first_name=first_name,
			last_name=last_name,
		)

		activation_key = self._generate_activation_key()
		pending_user.set_activation_key(activation_key)
		pending_user.set_password(password)
		pending_user.save()

		email_template_context = self._default_email_template_context(
			pending_user,
			activation_key,
		)

		try:
			self._send_activation_email(
				[email],
				email_template_context,
			)
		except ValidationError as err:
			pending_user.delete()
			raise err

		return pending_user



class ModelWithActivationKey(ModelBase):
	'''
	Base class. Requires .activate() method.
	'''

	activation_key = models.CharField(max_length=128, blank=True)


	def set_activation_key(self, raw_activation_key):
		self.activation_key = make_password(raw_activation_key)


	def try_activation(self, key):
		self.check_activation_key(key)
		return self.activate()


	def check_activation_key(self, key):
		if not check_password(key, self.activation_key):
			raise AuthenticationFailed('Invalid activation key')


	class Meta:
		abstract = True



class PendingUser(ModelWithActivationKey):
	'''
	PendingUser objects are created when new users register, and each is replaced by a full User once 'activated' (i.e. once their activation_key, send to them by email, is passed back to PendingUserDetailView).
	'''

	objects = PendingUserManager()
	first_name = models.CharField(max_length=30)
	last_name = models.CharField(max_length=30)
	email = models.EmailField(unique=True)
	password = models.CharField(max_length=128, blank=True)


	def set_password(self, raw_password):
		self.password = make_password(raw_password)


	def activate(self):
		full_user = User(**self._get_user_dict())
		full_user.save()
		self.delete()
		return full_user


	def _get_user_dict(self):
		user_dict = model_to_dict(self, exclude=['id', 'activation_key'])
		user_dict['username'] = self._generate_username()

		return user_dict


	def _generate_username(self):
		full_name = (self.first_name + self.last_name).lower()
		suffix_num = 1
		username = full_name

		while self._username_exists(username):
			username = '%s%i' % (full_name, suffix_num)
			suffix_num += 1

		return username


	def _username_exists(self, username):
		try:
			User.objects.get(username=username)
			return True
		except User.DoesNotExist:
			return False



class EmailChangeManager(ManagerWithActivationKey):

	activation_message_subject = 'Change your email address'
	template_name = 'change_email'
	activation_link_endpoint = 'changeemail'


	def create(self, user, new_email):
		activation_key = self._generate_activation_key()
		email_change = self._create_or_get_previous_object_for_user(
			user,
			{'new_email': new_email},
			activation_key,
		)

		try:
			self._send_activation_email(
				[new_email],
				self._get_email_template_context(email_change, activation_key),
			)
		except ValidationError:
			email_change.delete()
			raise

		return email_change


	def _get_email_template_context(self, email_change, activation_key):
		default_context = self._default_email_template_context(
			email_change,
			activation_key,
		)

		return dict(default_context, new_address=email_change.new_email)



class EmailTakenError(Exception):
	pass



def check_email_is_not_taken(email):
	for user_class in (User, PendingUser):
		with suppress(user_class.DoesNotExist):
			user_class.objects.get(email=email)
			raise EmailTakenError(email)



class EmailChange(ModelWithActivationKey):

	objects = EmailChangeManager()

	user = OneToOneField(
		User,
		on_delete=CASCADE,
		related_name='email_change',
		null=False,
	)

	new_email = EmailField()
	

	def activate(self):
		try:
			check_email_is_not_taken(self.new_email)
			self.user.email = self.new_email
		finally:
			self.delete()
			user = self.user
			user.email_change = None
			user.save()

		return user



class PasswordResetManager(ManagerWithActivationKey):

	activation_message_subject = 'Reset your password'
	template_name = 'reset_password'
	activation_link_endpoint = 'resetpassword'


	def create(self, user=None, email=None):
		if not user and not email:
			raise ValueError('User or email address must be specified')

		activation_key = self._generate_activation_key()
		user = user or User.objects.get(email=email)
		password_reset = self._create_or_get_previous_object_for_user(
			user,
			fields_dict={},
			activation_key=activation_key,
		)

		template_context = self._default_email_template_context(
			password_reset,
			activation_key,
		)

		try:
			self._send_activation_email([user.email], template_context)
		except ValidationError:
			password_reset.delete()
			raise

		return password_reset



class EmptyPasswordError(Exception):
	pass



class PasswordReset(ModelWithActivationKey):
	
	objects = PasswordResetManager()

	user = OneToOneField(
		User,
		on_delete=CASCADE,
	)


	def activate(self):
		pass


	def try_password_reset(self, activation_key, new_password):
		self.check_activation_key(activation_key)
		self.reset_password(new_password)


	def reset_password(self, new_password):
		if not new_password:
			raise EmptyPasswordError()

		self.user.set_password(new_password)
		self.user.save()
		self.delete()



@receiver(signals.pre_delete)
def pre_field_delete(sender, instance, using, **kwargs):
	'''
	Some models have image files attached, which need cleaning up on deletion.
	'''

	if isinstance(instance, ModelBase):
		instance.delete_image_files()
