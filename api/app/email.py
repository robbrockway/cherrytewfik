import os.path
from email.mime.image import MIMEImage

from django.core.mail import EmailMultiAlternatives
from django.template import Template, loader
from django.utils.html import escape, mark_safe

from django_config.settings import *



class TemplateEmailMessage(EmailMultiAlternatives):
	
	def __init__(self, subject, to, template_name, context):
		context['site_root'] = \
			context.get('site_root') or CT_FRONTEND_ROOT

		self._context = context
		self._template_name = template_name
		
		text_body = self._render('txt')
		html_body = self._render('html')

		super().__init__(
			subject,
			text_body,
			CT_EMAIL_SENDER_ADDRESS,
			to,
			alternatives=[(html_body, 'text/html')],
		)

		self._attach_logo()
		

	def _render(self, template_extension):
		template = loader.get_template(
			'%s.%s' % (self._template_name, template_extension),
		)

		return template.render(self._context)


	def _attach_logo(self):
		logo_image_path = os.path.join(
			CT_TEMPLATE_DIR,
			'images',
			'logo.png',
		)

		self.attach_image(logo_image_path)


	def attach_image(self, path):
		extension = path.split('.')[-1]
		if extension == 'svg':
			file_mode = 'r'
			extra_mime_kwargs = {'_subtype': 'svg+xml'}
		else:
			file_mode = 'rb'
			extra_mime_kwargs = {}

		with open(path, file_mode) as file:
			image = MIMEImage(file.read(), **extra_mime_kwargs)
		
		filename = os.path.split(path)[1]

		image.add_header('Content-ID', '<%s>' % filename)
		self.attach(image)



class OrderEmailMessage(TemplateEmailMessage):
	'''
	Subclasses must provide:
	.template_name
	.subject, or ._get_subject() override

	Optional member values/overrides:
	.extra_context dictionary (or _get_extra_context() override)
	._get_recipient_email_address_with_name() override
	'''


	PLACEHOLDER_IMAGE_FILENAME = 'piece_placeholder.png'
	
	extra_context = {}

	
	def __init__(self, order):
		self._order = order

		context = dict(
			self._get_extra_context(),
			order=order,
			pieces=self._process_pieces_for_context(),
			order_url=self._get_order_url(),
			customer_name=self._order.get_customer_name(),
			address_lines=order.get_address_lines(),
			pound_sign=mark_safe('£'),
		)

		super().__init__(
			self._get_subject(),
			[self._get_recipient_email_address_with_name()],
			self.template_name,
			context,
		)

		self._attach_piece_images()

		if self._any_imageless_pieces():
			self._attach_placeholder_image()


	def _get_extra_context(self):
		return self.extra_context


	def _process_pieces_for_context(self):
		return [
			{
				'name': piece.name,
				'price': piece.price,
				'image_filename': self._get_piece_image_filename(piece),
			}
			for piece in self._order.pieces.all()
		]


	def _get_piece_image_filename(self, piece):
		if piece.image.filename is None:
			return self.PLACEHOLDER_IMAGE_FILENAME

		return piece.image.filename


	def _get_order_url(self):
		return '%s/order/%i' % (CT_FRONTEND_ROOT, self._order.pk)


	def _get_subject(self):
		return self.subject


	def _get_recipient_email_address_with_name(self):
		return self._order.get_email_with_name()


	def _attach_piece_images(self):
		for piece in self._order.pieces.filter(image__isnull=False):
			image_path = piece.image.abs_image_path(width=180)
			self.attach_image(image_path)


	def _any_imageless_pieces(self):
		return bool(
			self._order.pieces.filter(image__isnull=True).count(),
		)


	def _attach_placeholder_image(self):
		image_path = os.path.join(
			CT_TEMPLATE_DIR,
			'images',
			self.PLACEHOLDER_IMAGE_FILENAME,
		)

		self.attach_image(image_path)



class ReceiptEmailMessage(OrderEmailMessage):
	
	template_name = 'receipt'
	subject = 'Your order has been placed'
	extra_context = {'is_new_order': True}



class EditReceiptEmailMessage(ReceiptEmailMessage):
	
	subject = 'Your order has been edited'
	extra_context = {'is_new_order': False}



class CancelEmailMessage(OrderEmailMessage):

	template_name = 'cancellation'
	subject = 'Your order has been cancelled'



class RefundEmailMessage(CancelEmailMessage):

	extra_context = {'is_refund': True}
	subject = 'Your purchase has been refunded'



class AdminOrderNotificationEmailMessage(OrderEmailMessage):
	
	template_name = 'admin_order_notification'
	subject_format = 'New order from %s'


	def _get_recipient_email_address_with_name(self):
		return CT_ADMIN_EMAIL


	def _get_subject(self):
		return self.subject_format % self._order.get_customer_name()


	def _get_extra_context(self):
		return {
			'user_link': self._get_user_link(),
			'admin_first_name': CT_ADMIN_FIRST_NAME,
			'is_new_order': True,
		}


	def _get_user_link(self):
		escaped_name = escape(self._order.get_customer_name())
		user = self._order.user
		if not user:
			return escaped_name

		full_link = '<a href="%s/user/%i">%s</a>' % (
			CT_FRONTEND_ROOT,
			user.pk,
			escaped_name,
		)

		return mark_safe(full_link)



class AdminEditNotificationEmailMessage(
	AdminOrderNotificationEmailMessage,
):

	subject_format = '%s\'s order has been edited'


	def _get_extra_context(self):
		return dict(
			super()._get_extra_context(),
			is_new_order=False,
		)



class AdminCancelNotificationEmailMessage(
	AdminOrderNotificationEmailMessage,
):

	template_name = 'admin_cancel_notification'
	subject_format = '%s\'s order has been cancelled'


	def _get_extra_context(self):
		return {
			'user_link': self._get_user_link(),
			'admin_first_name': CT_ADMIN_FIRST_NAME,
		}



class DispatchEmailMessage(OrderEmailMessage):
	
	template_name = 'dispatch'
	subject = 'Your order has been dispatched'
	extra_context = {'comment_url': CT_FRONTEND_ROOT + '/#comments'}

