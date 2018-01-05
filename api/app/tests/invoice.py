import os.path
from decimal import Decimal
from contextlib import suppress
import latex

from django.test import TestCase
from django.core import urlresolvers

from rest_framework import status
from rest_framework.serializers import ValidationError

from app.models import Order, Piece
from app.fields.multisize_image import MultisizeImage
from app.views.invoice import *
from app.templatetags.app_tags import *
from django_config.settings import BASE_DIR
from .models.order import OrderTestCommon
from . import TestWithUsers, LoginDetails, logged_in



class EscapeLaTeXTest(TestCase):

	def test_does_escape_backslash(self):
		self._check_does_escape('\\')

	
	def _check_does_escape(self, string):
		self.assertNotEqual(
			string,
			escape_latex(string),
		)


	def test_does_escape_open_brace(self):
		self._check_does_escape('{')


	def test_does_escape_close_brace(self):
		self._check_does_escape('}')



class InvoiceTestCommon(OrderTestCommon):

	def setUp(self):
		super().setUp()
		self.fields.initial['status'] = Order.DISPATCHED
		self._order = Order.objects.create(**self.fields.initial)
		self._init_pieces()


	def _init_pieces(self):
		for i in range(1, 5):
			self._init_piece(i)

		self._order.update_total_balance()
		self._order.save()


	def _init_piece(self, index):
		image_path = self._get_image_source_path(index)
		with open(image_path, 'rb') as image_file:
			image = MultisizeImage.create_from_file(
				image_file,
				Piece.get_image_field(),
			)

			Piece.objects.create(
				name='Piece %i' % index,
				price=Decimal('10.00') * index,
				order=self._order,
				image=image,
			)
		
			
	def _get_image_source_path(self, index):
		return os.path.join(
			BASE_DIR,
			'app',
			'tests',
			'media',
			'mass_upload',
			'%i.jpg' % index,
		)


	def tearDown(self):
		Piece.objects.all().delete()



class InvoiceRendererTest(InvoiceTestCommon, TestCase):

	def test_cant_create_invoice_for_pending_order(self):
		self._check_cant_create_invoice_for_order_with_status(
			Order.PENDING,
		)


	def _check_cant_create_invoice_for_order_with_status(self, status):
		self._order.status = status

		with suppress(ValidationError):
			InvoiceRenderer(self._order)
			self.fail('Creation should raise ValidationError')


	def test_cant_create_invoice_for_open_order(self):
		self._check_cant_create_invoice_for_order_with_status(Order.OPEN)

	
	def test_latex_code_contains_customer_name(self):
		self._check_latex_code_contains(self._order.get_customer_name())


	def _check_latex_code_contains(self, value):
		latex_code = self._render_template()
		self.assertTrue(str(value) in latex_code)

	
	def _render_template(self, **kwargs):
		renderer = InvoiceRenderer(self._order, **kwargs)
		return renderer.render_template()


	def test_latex_code_contains_recipient_name(self):
		self._check_latex_code_contains(self._order.recipient_name)


	def test_latex_code_contains_order_id(self):
		self._check_latex_code_contains(self._order.id)


	def test_latex_code_contains_address(self):
		for line in self._order.address.split('\n'):
			self._check_latex_code_contains(line)


	def test_latex_code_contains_piece_names(self):
		for piece in self._order.pieces.all():
			self._check_latex_code_contains(piece.name)


	def test_latex_code_contains_piece_prices(self):
		for piece in self._order.pieces.all():
			self._check_latex_code_contains(piece.price)


	def test_latex_code_contains_piece_image_filenames(self):
		for piece in self._order.pieces.all():
			self._check_latex_code_contains(piece.image.filename)


	def test_latex_code_contains_total_balance(self):
		self._check_latex_code_contains(self._order.total_balance)


	def test_latex_code_contains_date(self):
		self._check_latex_code_contains(
			self._order.datetime.strftime('%d-%m-%Y'),
		)


	def test_partial_invoice_includes_specified_pieces(self):
		latex_code = self._render_template_with_first_two_pieces()
		for piece in self._order.pieces.all()[:2]:
			self.assertTrue(piece.name in latex_code)


	def _render_template_with_first_two_pieces(self):
		return self._render_template(
			pieces=self._order.pieces.all()[:2],
		)


	def test_partial_invoice_excludes_other_pieces(self):
		latex_code = self._render_template_with_first_two_pieces()
		for piece in self._order.pieces.all()[2:]:
			self.assertFalse(piece.name in latex_code)


	def test_renderer_escapes_latex(self):
		self._order.customer_name = '\textbf{Customer name}'
		escaped_string = latex.escape(self._order.customer_name)
		
		self._check_latex_code_contains(escaped_string)


	def test_can_create_pdf(self):
		with InvoiceRenderer(self._order) as renderer:
			pdf_file = renderer.create_pdf()
			self.assertTrue(pdf_file)


	def test_can_create_pdf_with_imageless_pieces(self):
		'''
		Pieces without images might prompt LaTeX to embed nonexistent files. Make sure this doesn't happen.
		'''
		for piece in Piece.objects.all():
			piece.image = None
			piece.save()

		self.test_can_create_pdf()


	def test_context_manager_deletes_temp_files_afterwards(self):
		with InvoiceRenderer(self._order) as renderer:
			renderer.create_pdf()
			
		for extension in ['tex', 'pdf', 'log', 'aux']:
			self.assertFalse(
				os.path.exists(
					'%s.%s' % (renderer.base_path, extension),
				),
			)



class InvoiceViewTest(
	InvoiceTestCommon,
	TestWithUsers,
	TestCase,
):

	def test_can_view_invoice_as_staff(self):
		response = self._view_invoice(LoginDetails.STAFF)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response['Content-Type'], 'application/pdf')
		

	@logged_in
	def _view_invoice(self, pieces=None):
		return self._client.post(
			self._get_invoice_url(),
			self._create_request_data(pieces),
			format='json',
		)


	def _get_invoice_url(self):
		return urlresolvers.reverse(
			'invoice',
			kwargs={'pk': self._order.pk},
		)


	def _create_request_data(self, pieces=None):
		if pieces is None:
			return None

		return {'pieces': [piece.pk for piece in pieces]}


	def test_can_view_partial_invoice_as_staff(self):
		response = self._view_partial_invoice(LoginDetails.STAFF)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response['Content-Type'], 'application/pdf')


	def _view_partial_invoice(self, login_details=None):
		return self._view_invoice(
			login_details,
			pieces=self._order.pieces.all()[:1]
		)


	def test_cant_view_invoice_as_nonstaff(self):
		response = self._view_invoice(LoginDetails.NONSTAFF)
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


	def test_partial_invoice_is_lighter_than_full_invoice(self):
		partial_response = self._view_partial_invoice(LoginDetails.STAFF)
		full_response = self._view_invoice(LoginDetails.STAFF)

		self.assertLess(
			len(partial_response.content),
			len(full_response.content),
		)

		
	def test_response_has_attachment_disposition(self):
		response = self._view_invoice(LoginDetails.STAFF)
		self.assertEqual(
			response['Content-Disposition'],
			'attachment; filename=order%i.pdf' % self._order.pk,
		)