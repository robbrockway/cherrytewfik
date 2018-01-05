import os, os.path
import subprocess
from tempfile import TemporaryFile, gettempdir
from latex.exc import LatexBuildError
from wsgiref.util import FileWrapper

from django import template
from django.template import loader
from django.utils import dateformat
from django.utils.html import mark_safe
from django.http import HttpResponse, Http404

from rest_framework.views import APIView
from rest_framework.serializers import ValidationError
from rest_framework.exceptions import PermissionDenied

from django_config.settings import *
from ..models import Order, Piece
from ..utils import piece_price_sum, random_string



class InvoiceRenderer:

	def __init__(self, order, pieces=None):
		self._order = order
		self._check_order_status()

		self.selected_pieces = pieces or order.pieces.all()


	def __enter__(self):
		self._init_base_path()
		return self


	def _init_base_path(self):
		if hasattr(self, 'base_path'):
			return

		dir = gettempdir()

		while True:
			self.base_path = os.path.join(
				dir,
				random_string(),
			)

			if not os.path.exists(self.get_tex_path()):
				return


	def get_tex_path(self):
		return self.base_path + '.tex'


	def __exit__(self, *args):
		if hasattr(self, 'pdf_file'):
			self.pdf_file.close()

		self._delete_temp_files()


	def _delete_temp_files(self):
		for path in [
			self.get_tex_path(),
			self.get_pdf_path(),
			self.get_log_path(),
			self.get_aux_path(),
		]:
			if os.path.isfile(path):
				os.remove(path)


	def get_pdf_path(self):
		return self.base_path + '.pdf'


	def get_log_path(self):
		return self.base_path + '.log'


	def get_aux_path(self):
		return self.base_path + '.aux'


	def _check_order_status(self):
		if self._order.status != Order.DISPATCHED:
			raise ValidationError(
				'Cannot create invoice for undispatched order',
			)


	def render_template(self):
		template = loader.get_template('invoice.tex')
		return template.render(self._get_template_context())


	def _get_template_context(self):
		return {
			'order': self._order,
			'customer_name': self._order.get_customer_name(),
			'address_lines': self._order.get_address_lines(),
			'date': self._process_date_for_context(),
			'pieces': self._process_pieces_for_context(),
			'total_balance': piece_price_sum(self.selected_pieces),
			'template_dir': self._get_template_dir_for_context(),
		}


	def _process_date_for_context(self):
		date = self._order.datetime
		return {
			'day': date.day,
			'ordinal': dateformat.format(date, 'S'),
			'padded_day': '%02d' % date.day,
			'num_month': '%02d' % date.month,
			'word_month': date.strftime('%B'),
			'year': date.year,
		}


	def _process_pieces_for_context(self):
		return [
			{
				'name': piece.name,
				'price': piece.price,
				'image_filename': self._get_piece_image_filename(piece),
			}
			for piece in self.selected_pieces
		]


	def _get_piece_image_filename(self, piece):
		return piece.image.filename if piece.image else None


	def _get_template_dir_for_context(self):
		return CT_TEMPLATE_DIR.replace('\\', '/')


	def create_pdf(self):
		self._init_base_path()

		source = self.render_template()
		with open(self.get_tex_path(), mode='w') as tex_file:
			tex_file.write(source)
			tex_file.close()

		self._call_xelatex()

		self.pdf_file = open(self.get_pdf_path(), mode='rb')
		return self.pdf_file


	def _call_xelatex(self):
		args = [
			'xelatex',
			self.get_tex_path(),
			'-output-directory=' + self._get_temp_dir(),
		]
		
		try:
			subprocess.check_call(
				args,
				**self._get_xelatex_streams(),
			)
		except subprocess.CalledProcessError as err:
			raise LatexBuildError(self.get_log_path()) from err


	def _get_temp_dir(self):
		return os.path.dirname(self.base_path)


	def _get_xelatex_streams(self):
		return {
			'stdin': open(os.devnull, 'r'),
			'stdout': open(os.path.join(BASE_DIR, 'xelatex_output.txt'), 'w'),
			'stderr': open(os.path.join(BASE_DIR, 'xelatex_error.txt'), 'w'),
		}



class InvoiceView(APIView):

	def post(self, request, *args, **kwargs):
		self._validate_user()
		self._init_order()
		
		with self._create_renderer() as renderer:
			pdf_file = renderer.create_pdf()
			return self._response(pdf_file)


	def _validate_user(self):
		if not self.request.user.is_staff:
			raise PermissionDenied()


	def _create_renderer(self):
		pieces = self._get_pieces()
		return InvoiceRenderer(self._order, pieces)
		

	def _init_order(self):
		try:
			self._order = Order.objects.get(pk=self.kwargs['pk'])
		except Order.DoesNotExist:
			raise Http404('Order not found')


	def _get_pieces(self):
		piece_pks = self.request.data.get('pieces')
		if not piece_pks:
			return None

		return Piece.objects.filter(pk__in=piece_pks)


	def _response(self, pdf_file):
		response = HttpResponse(
			FileWrapper(pdf_file),
			content_type='application/pdf',
		)

		response['Content-Disposition'] = \
			'attachment; filename=order%i.pdf' % self._order.pk

		return response
