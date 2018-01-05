from decimal import Decimal
from email.mime.image import MIMEImage

from django.test import TestCase
from django.core import mail

from ..email import *
from ..models import Order, Piece
from ..fields.multisize_image import MultisizeImage
from .fields.multisize_image import TEST_IMAGE_PATH
from . import TestWithUsers
from django_config.settings import *



class TemplateEmailTest(TestCase):

	@classmethod
	def setUpTestData(cls):
		cls.message_context = {
			'site_root': 'http://blah.com/',
			'activation_url': 'http://blah.com/blah',
			'user': {
				'first_name': 'Testy',
				'last_name': 'McTestface',
			},
		}

		cls.message_data = {
			'subject': 'Test message',
			'to': ['possiblytherob@gmail.com'],
			'template_name': 'activate_account',
			'context': cls.message_context
		}


	def setUp(self):
		self._message = TemplateEmailMessage(**self.message_data)


	def test_correct_metadata(self):
		self.assertEqual(
			self._message.subject,
			self.message_data['subject'],
		)

		self.assertEqual(
			self._message.to,
			self.message_data['to'],
		)


	def test_correct_sender_address(self):
		self.assertEqual(self._message.from_email, CT_EMAIL_SENDER_ADDRESS)


	def test_has_image_attachment(self):
		self.assertTrue(self._message.attachments)
		self.assertTrue(
			isinstance(self._message.attachments[0], MIMEImage),
		)


	def test_image_has_correct_headers(self):
		headers_dict = dict(self._message.attachments[0]._headers)
		self.assertEqual(headers_dict['Content-ID'], '<logo.png>')
		self.assertEqual(headers_dict['Content-Type'], 'image/png')


	def test_correct_text_body(self):
		self.assertTrue(self._name_string() in self._message.body)
		self.assertTrue('activate your account, go to' in self._message.body)


	def _name_string(self):
		return ' '.join(
			self.message_context['user'].values()
		)


	def test_correct_html_body(self):
		self.assertEqual(self._message.alternatives[0][1], 'text/html')

		html_body = self._message.alternatives[0][0]
		self.assertTrue(self._name_string() in html_body)
		self.assertTrue('<a href=' in html_body)


	def test_send(self):
		self._message.send()

		self.assertEqual(len(mail.outbox), 1)
		self.assertEqual(
			mail.outbox[0].subject,
			self.message_data['subject'],
		)



class OrderEmailTestBase(TestWithUsers):
	'''
	Requires:
    .email_class
	.expected_subject (or override of test_for_correct_subject())
	'''

	ORDER_FIELDS = {
		'customer_name': 'Joanne Bloggs',
		'recipient_name': 'Joseph Bloggs',
		'address':
			'24 Potty Lane\n'
			'Pottingham\n'
			'PT94 7CU',
		'total_balance': Decimal('180.00'),
	}

	PIECE_FIELDS = [
		{'name': 'Piece 1', 'price': Decimal('50.00')},
		{'name': 'Piece 2', 'price': Decimal('60.00')},
		{'name': 'Piece 3', 'price': Decimal('70.00')},
	]

	PLACEHOLDER_IMAGE_FILENAME = 'piece_placeholder.png'


	def setUp(self):
		super().setUp()
		self._init_order()
		self._init_message()


	def tearDown(self):
		Piece.objects.all().delete()


	def _init_order(self):
		self._order = Order.objects.create(
			user=self._nonstaff_user,
			**self.ORDER_FIELDS,
		)
		self._init_pieces()


	def _init_pieces(self):
		with open(TEST_IMAGE_PATH, 'rb') as image_file:
			for fields in self.PIECE_FIELDS:
				self._init_piece(fields, image_file)


	def _init_piece(self, fields, image_file):
		if fields == self.PIECE_FIELDS[-1]:
			image = None	# Let's have just one imageless piece
		else:
			image = MultisizeImage.create_from_file(
				image_file,
				field=Piece.get_image_field(),
			)

		Piece.objects.create(
			order=self._order,
			image=image,
			**fields
		)


	def _init_message(self):
		self._message = self.email_class(self._order)


	def test_for_correct_subject(self):
		self.assertEqual(self._message.subject, self.expected_subject)


	def test_message_includes_order_data(self):
		expected_strings = self._get_expected_metadata_strings()
		
		for piece in self._order.pieces.all():
			expected_strings += [piece.name, str(piece.price)]
			self._check_image_filename_is_in_html_body(piece)

		for string in expected_strings:
			self._check_message_for_string(string)


	def _get_expected_metadata_strings(self):
		user = self._order.user

		return [
			user.first_name,
			user.last_name,
			self._order.get_customer_name(),
		] + self._order.address.split('\n')


	def _check_message_for_string(self, string):
		self.assertTrue(string in self._get_text_body())
		self.assertTrue(string in self._get_html_body())


	def _get_text_body(self):
		return self._message.body


	def _get_html_body(self):
		return self._message.alternatives[0][0]


	def _check_image_filename_is_in_html_body(self, piece):
		filename = (
			self.PLACEHOLDER_IMAGE_FILENAME if piece.image.filename is None
			else piece.image.filename
		)

		self.assertTrue(filename in self._get_html_body())


	def test_piece_images_are_attached(self):
		for piece in self._order.pieces.filter(image__isnull=False):
			self._check_image_is_attached(piece.image.filename)


	def test_placeholder_image_is_attached(self):
		self._check_image_is_attached(self.PLACEHOLDER_IMAGE_FILENAME)


	def test_placeholder_image_is_not_attached_if_no_imageless_pieces(self):
		self._remove_imageless_pieces_from_message()
		
		for attachment in self._message.attachments:
			headers_dict = dict(attachment._headers)
			self.assertFalse(
				self.PLACEHOLDER_IMAGE_FILENAME in headers_dict['Content-ID'],
			)


	def _remove_imageless_pieces_from_message(self):
		imageless_pieces = Piece.objects.filter(image=None)
		imageless_pieces.delete()
		self._init_message()


	def _check_image_is_attached(self, filename):
		for attachment in self._message.attachments:
			headers_dict = dict(attachment._headers)
			if headers_dict['Content-ID'] == '<%s>' % filename:
				return

		self.fail('Image %s is not attached' % filename)


	def _set_order_to_guest(self):
		self._order.email = self.GUEST_EMAIL_ADDRESS
		self._order.user = None
		self._order.save()



class OrderURLTestMixin:

	def test_message_includes_order_url(self):
		expected_url = '%s/order/%i' % (CT_FRONTEND_ROOT, self._order.pk)
		self._check_message_for_string(expected_url)



class TotalBalanceTestMixin:

	def test_message_includes_total_balance(self):
		self._check_message_for_string(
			str(self._order.total_balance),
		)



class UserRecipientTestMixin:

	def test_user_is_recipient(self):
		self._check_message_recipient_matches_order(self._message)


	def _check_message_recipient_matches_order(self, message):
		self.assertTrue(self._order.get_email_with_name() in message.to)


	def test_correct_recipient_of_guest_order(self):
		self._set_order_to_guest()
		message = self.email_class(self._order)
		self._check_message_recipient_matches_order(message)



class ReceiptEmailTest(
	OrderURLTestMixin,
	TotalBalanceTestMixin,
	UserRecipientTestMixin,
	OrderEmailTestBase,
	TestCase,
):

	email_class = ReceiptEmailMessage
	expected_subject = 'Your order has been placed'



class EditReceiptEmailTest(ReceiptEmailTest):

	email_class = EditReceiptEmailMessage
	expected_subject = 'Your order has been edited'



class CancelEmailTest(
	OrderEmailTestBase,
	TestCase,
):

	email_class = CancelEmailMessage
	expected_subject = 'Your order has been cancelled'



class RefundEmailTest(
	TotalBalanceTestMixin,
	CancelEmailTest,
):

	email_class = RefundEmailMessage
	expected_subject = 'Your purchase has been refunded'



class AdminNotificationEmailTestBase(OrderEmailTestBase):

	def test_admin_first_name_is_in_message(self):
		self._check_message_for_string(CT_ADMIN_FIRST_NAME)


	def test_for_correct_recipient_email(self):
		self.assertTrue(CT_ADMIN_EMAIL in self._message.to)


	def test_for_correct_subject(self):
		self._check_message_for_correct_subject(self._message)


	def _check_message_for_correct_subject(self, message):
		expected_subject = self.expected_subject_format_string % \
			self._order.get_customer_name()

		self.assertEqual(message.subject, expected_subject)


	def test_for_correct_subject_with_guest_order(self):
		self._set_order_to_guest()
		message = self.email_class(self._order)
		self._check_message_for_correct_subject(message)



class AdminOrderNotificationEmailTest(
	OrderURLTestMixin,
	TotalBalanceTestMixin,
	AdminNotificationEmailTestBase,
	TestCase,
):

	email_class = AdminOrderNotificationEmailMessage
	expected_subject_format_string = 'New order from %s'



class AdminEditNotificationEmailTest(
	AdminOrderNotificationEmailTest,
):

	email_class = AdminEditNotificationEmailMessage
	expected_subject_format_string = '%s\'s order has been edited'



class AdminCancelNotificationEmailTest(
	AdminNotificationEmailTestBase,
	TestCase,
):

	email_class = AdminCancelNotificationEmailMessage
	expected_subject_format_string = '%s\'s order has been cancelled'



class DispatchEmailTest(
	OrderEmailTestBase,
	UserRecipientTestMixin,
	TestCase,
):

	email_class = DispatchEmailMessage
	expected_subject = 'Your order has been dispatched'

