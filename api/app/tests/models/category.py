from django.test import TestCase
from django.core import urlresolvers

from app.models import Category, Piece
from app.utils import *
from .modeltest_base import *
from .piece import *
from .. import logged_in



class CategoryTestCommon:

	@classmethod
	def _init_params(cls):
		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'name': 'Test category',
			'description': 'Category category category',
		}

		cls.fields.changed = {
			'name': 'Altered test category',
			'description': 'Altered altered altered',
		}

		cls.model_class = Category



class CategoryTest(
	CategoryTestCommon,
	OrderedModelTestMixin,
	ModelTestBase,
	TestCase
):
	
	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.list_index_field_name = 'index_in_list'



class CategoryViewTest(
	CategoryTestCommon,
	ModelViewTestBase,
	OrderedModelViewTestMixin,
	ImageTestCommon,
	TestCase,
):

	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.list_view_name = 'category_list'
		cls.detail_view_name = 'category_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_WRITE
		
		cls._take_image_properties_from_piece_test()


	# For mass upload
	@classmethod
	def _take_image_properties_from_piece_test(cls):
		cls.image_widths = PieceTestCommon.image_widths	
		cls.image_dest_path_root = PieceTestCommon.image_dest_path_root


	def test_retrieve_category_with_contents(self):
		category = Category.objects.get()
		initial_piece_dict_list = create_data_for_multiple_pieces()
		create_pieces_from_list_of_dicts(
			initial_piece_dict_list,
			category,
		)

		response = self._retrieve_object(LoginDetails.STAFF)
		self.assertTrue('pieces' in response.data)

		# Initial piece data doesn't contain category info or IDs, so remove them from response data before we compare
		response_piece_dict_list = remove_keys_from_list_of_dicts(
			response.data['pieces'],
			'category', 'id', 'index_in_cat',
		)

		self.assertTrue(
			dict_lists_are_equal_for_nonempty_values(
				initial_piece_dict_list,
				response_piece_dict_list,
			),
		)


	def test_mass_image_upload_saves_files(self):
		response = self._do_mass_image_upload()

		for piece_dict in response.data:
			filename = piece_dict['image']
			self._check_images_have_correct_widths(filename)
			self._clean_files(filename)


	def _do_mass_image_upload(self):
		images = self._open_images_for_upload()
		url = self._get_object_url()

		self._client.login(**LoginDetails.STAFF)
		response = self._client.post(
			url,
			{'images[]': images},
			'multipart',
		)
		self._client.logout()

		for image in images:
			image.close()

		return response


	def _open_images_for_upload(self):
		source_dir = os.path.join(
			TEST_MEDIA_DIR,
			'mass_upload',
		)

		image_paths = [
			os.path.join(source_dir, filename)
			for filename in os.listdir(source_dir)
		]

		return [open(path, mode='rb') for path in image_paths]


	def test_mass_image_upload_adds_pieces_to_category(self):
		response = self._do_mass_image_upload()
		expected_category_pk = Category.objects.first().pk

		for piece_dict in response.data:
			self._check_piece_dict_belongs_to_category(
				piece_dict,
				expected_category_pk,
			)

			self._clean_piece_files(piece_dict)


	def _check_piece_dict_belongs_to_category(
		self,
		piece_dict,
		expected_category_pk,
	):
		self.assertEqual(
			piece_dict['category'],
			expected_category_pk,
		)


	def _clean_piece_files(self, piece_dict):
		filename = piece_dict['image']
		self._clean_files(filename)