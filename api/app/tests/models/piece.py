import os.path

from django.test import TestCase
from django.core import urlresolvers

from rest_framework import status

from app.fields.piece_date import PieceDate
from app.fields.multisize_image import MultisizeImage
from app.models import *
from app.utils import *
from django_config.settings import CT_IMAGE_DIR

from .modeltest_base import *
from . import TEST_MEDIA_DIR



class PieceTestCommon:
	
	image_dest_path_root = os.path.join(
		CT_IMAGE_DIR,
		'pieces',
	)

	image_widths = [
		MultisizeImage.FULL_SIZE,
		720, 360, 180,
	]


	@classmethod
	def _init_params(cls):
		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'name': 'Potty McPotface',
			'date': '2017-01',
			'price': 50.,
			'description': 'Potty potty pot pot pot',
			'index_in_cat': 2,
			'visible': True
		}

		cls.fields.changed = {
			'name': 'Pooty McPootface',
			'date': '2017-02',
			'price': 60.,
			'description': 'This piece has been altered',
			'index_in_cat': 1,
			'visible': True
		}

		cls.model_class = Piece

		cls.image_source_path = os.path.join(
			TEST_MEDIA_DIR,
			'resize_test.jpg',
		)



class PieceTest(
	PieceTestCommon,
	OrderedModelTestMixin,
	ModelTestBaseWithImage,
	TestCase
):
	
	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.list_index_field_name = 'index_in_cat'

		# Test pieces need to belong to a category, so they can be listed by category
		category = Category.objects.create()
		for fields in [cls.fields.initial, cls.fields.changed]:
			fields['category'] = category


	def setUp(self):
		super().setUp()
		self.image = open(self.image_source_path, 'rb')


	def tearDown(self):
		self.image.close()
		super().tearDown()


	def test_category_deletion_cascades_to_pieces(self):
		category = Category(name='Parent category')
		category.save()

		piece_pk_list = []
		image_filename_list = []

		for i in range(0, 3):
			piece = Piece(
				name='Piece %i' % i,
				image=self._create_multisize_image(),
				category=category,
			)

			piece.save()
			piece_pk_list.append(piece.pk)
			image_filename_list.append(piece.image.filename)

		pieces_in_category = Piece.objects.filter(category=category)
		self.assertEqual(len(pieces_in_category), 3)
		self._check_image_widths_for_multiple_filenames(*image_filename_list)

		category.delete()

		pieces_in_category = Piece.objects.filter(pk__in=piece_pk_list)
		self.assertFalse(pieces_in_category)
		self._check_images_deleted_for_multiple_filenames(*image_filename_list)


	def _create_multisize_image(self):
		return MultisizeImage.create_from_file(
			self.image,
			Piece.get_image_field(),
		)


	def _get_filter_kwargs_for_list_containing(self, object):
		'''
		Ordered-list tests need to know that a 'list', in this case, only involves pieces from one category
		'''
		return {'category': object.category}



class PieceViewTest(
	PieceTestCommon,
	ModelViewTestBaseWithImage,
	OrderedModelViewTestMixin,
	TestCase,
):

	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.list_view_name = 'piece_list'
		cls.detail_view_name = 'piece_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_WRITE


	def setUp(self):
		super().setUp()

		self.order_fields = {
			'user': self._nonstaff_user,
			'recipient_name': 'Testy McTestface',
			'address': 'Address',
			'total_balance': 50.,
		}


	def test_listed_pieces_are_sequenced_correctly(self):
		self._create_object(LoginDetails.STAFF, self.fields.initial)
		self._create_object(LoginDetails.STAFF, self.fields.changed)
		
		response = self._list_objects(LoginDetails.STAFF)

		prev_row = None
		for row in response.data:
			if prev_row:
				self.assertTrue(row['index_in_cat'] >= prev_row['index_in_cat'])
			prev_row = row


	def test_retrieve_piece_with_category(self):
		category = Category(name='Test category')
		category.save()

		self._object.category = category
		self._object.save()

		initial_sibling_dict_list = create_data_for_multiple_pieces()
		create_pieces_from_list_of_dicts(
			initial_sibling_dict_list,
			category,
		)

		response_sibling_dict_list = self._request_sibling_dict_list()
		
		response_sibling_dict_list = remove_keys_from_list_of_dicts(
			response_sibling_dict_list,
			'index_in_cat',		# Indices are assigned automatically, so weren't in initial dicts
		)

		self.assertTrue(
			dict_lists_are_equal_for_nonempty_values(
				initial_sibling_dict_list,
				response_sibling_dict_list,
			),
		)


	def _request_sibling_dict_list(self):
		'''
		Fetches and returns a dictionary representation of each sibling (i.e. piece from the same category) of self.object, via HTTP. Dictionaries are stored in a list.
		'''

		response = self._retrieve_piece_with_category()
		category_dict = response.data['category']

		self.assertTrue('pieces' in category_dict)

		main_piece = self._object
		sibling_dict_list = remove_piece_from_list_of_dicts(
			category_dict['pieces'],
			piece=main_piece,
		)
		
		# Remove extra fields, so these dicts match the initial ones that created our pieces
		return remove_keys_from_list_of_dicts(
			sibling_dict_list,
			'category', 'id',
		)


	def _retrieve_piece_with_category(self):
		url = urlresolvers.reverse(
			'piece_detail',
			kwargs={'pk': self._object.pk},
		) + '?withcategory'

		return self._client.get(
			url,
			format='json',
		)


	def test_cant_view_invisible_piece_as_nonstaff(self):
		self._init_invisible_piece()

		response = self._retrieve_object(
			LoginDetails.NONSTAFF,
			self.invisible_piece.pk,
		)
		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

		
	def _init_invisible_piece(self):
		self.invisible_piece_fields = dict(
			self.fields.initial,
			name='Invisible piece',
			visible=False,
		)

		self.invisible_piece = Piece.objects.create(
			**self.invisible_piece_fields,
		)


	def test_can_view_invisible_piece_as_staff(self):
		self._init_invisible_piece()

		self._response = self._retrieve_object(
			LoginDetails.STAFF,
			self.invisible_piece.pk,
		)
		self._check_response_as_staff(self.invisible_piece_fields)


	def test_cant_see_invisible_piece_in_list_as_nonstaff(self):
		self._init_invisible_piece()
		self._response = self._list_objects(LoginDetails.NONSTAFF)
		self.assertFalse(self._invisible_piece_in_response_list())


	def _invisible_piece_in_response_list(self):
		return any(
			piece_dict['id'] == self.invisible_piece.id
			for piece_dict in self._response.data
		)


	def test_can_see_invisible_piece_in_list_as_staff(self):
		self._init_invisible_piece()
		self._response = self._list_objects(LoginDetails.STAFF)
		self.assertTrue(self._invisible_piece_in_response_list())


	def test_reorder_as_staff(self):
		category = Category(name='Test category')
		category.save()

		response = self._request_reorder(
			LoginDetails.STAFF,
			category=category,
		)
		self._check_for_reorder_success(response)


	def test_can_view_basket_last_updated_time_whilst_logged_out(self):
		self._add_piece_to_basket(LoginDetails.NONSTAFF)
		response = self._retrieve_object(login_details=None)

		self.assertTrue('basket' in response.data)
		self.assertTrue('last_updated' in response.data['basket'])


	@logged_in
	def _add_piece_to_basket(self):
		return self._empty_put(self._get_add_to_basket_url())


	def _get_add_to_basket_url(self):
		return urlresolvers.reverse(
			'add_to_basket',
			kwargs={'pk': self._object.pk},
		)


	def test_cant_view_basket_contents_whilst_logged_out(self):
		self._add_piece_to_basket(LoginDetails.NONSTAFF)
		response = self._retrieve_object(login_details=None)
		self._check_piece_dict_excludes_basket_detail(response.data)


	def _check_piece_dict_excludes_basket_detail(self, piece_dict):
		self.assertFalse('user' in piece_dict['basket'])
		self.assertFalse('pieces' in piece_dict['basket'])


	def test_can_view_own_basket_detail(self):
		self._add_piece_to_basket(LoginDetails.NONSTAFF)
		self._response = self._retrieve_object(LoginDetails.NONSTAFF)
		self._check_response_for_basket_detail()


	def _check_response_for_basket_detail(self):
		self._check_piece_dict_includes_basket_detail(self._response.data)


	def _check_piece_dict_includes_basket_detail(self, piece_dict):
		self.assertTrue('basket' in piece_dict)
		basket_dict = piece_dict['basket']
		
		self.assertEqual(basket_dict['user'], self._nonstaff_user.pk)


	def test_can_get_own_basket_detail_from_piece_list(self):
		self._add_piece_to_basket(LoginDetails.NONSTAFF)
		response = self._list_objects(LoginDetails.NONSTAFF)
		self.assertTrue(response.data)
		self._check_piece_dict_includes_basket_detail(response.data[0])


	def test_cant_get_other_basket_detail_from_piece_list(self):
		self._add_piece_to_other_users_basket()
		response = self._list_objects(LoginDetails.NONSTAFF)
		self.assertTrue(response.data)
		self._check_piece_dict_excludes_basket_detail(response.data[0])


	def _add_piece_to_other_users_basket(self):
		self._response = self._add_piece_to_basket(LoginDetails.STAFF)


	def test_cant_view_order_detail_whilst_logged_out(self):
		self._add_piece_to_order()
		self._response = self._retrieve_object()
		self._check_piece_dict_excludes_order_detail()


	def _add_piece_to_order(self, **extra_order_fields):
		fields = dict(self.order_fields, **extra_order_fields)

		order = Order.objects.create(**fields)
		Piece.objects.update(order=order)


	def _check_piece_dict_excludes_order_detail(self, piece_dict=None):
		piece_dict = piece_dict or self._response.data
		
		self.assertTrue('order' in piece_dict)
		self.assertFalse(piece_dict['order'])


	def test_cant_view_other_users_order_detail(self):
		self._add_piece_to_order()
		self._init_additional_user()
		self._response = self._retrieve_object(LoginDetails.ADDITIONAL)
		self._check_piece_dict_excludes_order_detail()


	def test_can_view_own_order_detail(self):
		self._add_piece_to_order()
		self._response = self._retrieve_object(LoginDetails.NONSTAFF)
		self._check_piece_dict_includes_order_detail()


	def _check_piece_dict_includes_order_detail(
		self,
		piece_dict=None,
		expected_order_dict=None,
	):
		piece_dict = piece_dict or self._response.data
		expected_order_dict = expected_order_dict or self.order_fields
		actual_order_dict = piece_dict.get('order')

		self.assertTrue(actual_order_dict)

		expected_order_dict = self._format_order_dict_to_match_response(
			expected_order_dict,
		)

		for key, expected_value in expected_order_dict.items():
			self.assertEqual(actual_order_dict[key], expected_value)

		
	def _format_order_dict_to_match_response(self, order_dict):
		'''
		Creates a dictionary of expected JSON response data, which will contain a user PK (not a User instance) and a total_balance string (not a float or Decimal).
		'''

		result = dict(order_dict)
		result.update({
			'user': result['user'].pk,
			'total_balance': '%.2f' % result['total_balance'],
		})

		return result


	def test_can_get_own_order_detail_from_piece_list(self):
		self._add_piece_to_order()
		response = self._list_objects(LoginDetails.NONSTAFF)
		self._check_piece_dict_includes_order_detail(response.data[0])


	def test_cant_get_other_order_detail_from_piece_list(self):
		self._add_piece_to_order(user=self._staff_user)
		response = self._list_objects(LoginDetails.NONSTAFF)
		self._check_piece_dict_excludes_order_detail(response.data[0])


	def test_can_view_all_order_details_in_piece_list_as_staff(self):
		self._add_piece_to_order()
		response = self._list_objects(LoginDetails.STAFF)
		self._check_piece_dict_includes_order_detail(response.data[0])



def create_data_for_multiple_pieces():
	template = {
		'name': 'Piece %i',
		'description': 'Description %i',
		'price': '%i00.00',
	}

	def create_piece_dict(template, index):
		return {
			k: v % index
			for k, v in template.items()
		}

	return [
		create_piece_dict(template, index)
		for index in range(1, 6)
	]



def create_pieces_from_list_of_dicts(piece_dict_list, parent_category=None):
	for piece_dict in piece_dict_list:
		Piece.objects.create(category=parent_category, **piece_dict)


def remove_piece_from_list_of_dicts(piece_dict_list, piece):
	return [
		dict for dict in piece_dict_list
		if dict['id'] != piece.id
	]