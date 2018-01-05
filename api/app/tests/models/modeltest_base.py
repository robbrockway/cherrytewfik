import os.path
import re
from contextlib import suppress
from datetime import datetime
from PIL import Image
from random import random

import django
from django.db.models import Model, Max
from django.core import urlresolvers, mail
from django.contrib.auth.models import User

from rest_framework.test import APIClient
from rest_framework import status

from app.fields.multisize_image import *
from app.utils import ExceptionWithMessage

from .. import LoginDetails, \
	logged_in, TestWithUsers, request_denied



class ModelTestBase:
	'''
	Subclasses must implement the _init_params() class method, in which certain class variables are to be set:

	.model_class: the model class to be tested
	.fields: instance of ModelTestFields containing data for create and update operations
	'''

	@classmethod
	def setUpTestData(cls):
		cls._init_params()


	def setUp(self):
		if self.model_class == None:
			raise ModelClassError()

		self._object = self._create_object()
		self._client = APIClient()


	def _create_object(self):
		return self.model_class(**self.fields.initial)
	

	def test_add_object(self):
		old_count = self.model_class.objects.count()
		self._object.save()
		new_count = self.model_class.objects.count()
		self.assertNotEqual(old_count, new_count)



class ModelTestBaseWithActivationKey(ModelTestBase):
	'''
	.activation_view_name must be set in _init_params(), on top of ModelTestBase's parameters.
	'''

	def _create_object(self):
		return self.model_class.objects.create(**self.fields.initial)


	def test_add_object(self):
		'''
		Models with activation keys are ready-saved by their managers on creation, so let's create a new one rather than saving one that's already initialised (as ModelTestBase does).
		'''
		old_count = self.model_class.objects.count()

		object = self.model_class.objects.create(**self.fields.changed)

		new_count = self.model_class.objects.count()
		self.assertNotEqual(old_count, new_count)


	def test_creation_sends_email(self):
		initial_outbox_size = len(mail.outbox)
		self.model_class.objects.create(**self.fields.changed)

		self.assertGreater(
			len(mail.outbox),
			initial_outbox_size,
		)


	def test_object_can_be_activated(self):
		self._response = self._request_activation()
		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self._after_successful_activation()
		self._after_activation_attempt()


	def _request_activation(self, object=None, key=None):
		request_data = {
			'activation_key': key or get_activation_key_from_email(),
		}
		
		return self._client.put(
			self._get_activation_url(object),
			request_data,
			format='json',
		)


	def _get_activation_url(self, object=None):
		object = object or self._object

		return urlresolvers.reverse(
			self.activation_view_name,
			kwargs={'pk': object.pk},
		)


	def _after_successful_activation(self):
		self._check_object_is_deleted()


	def _after_activation_attempt(self):
		pass


	def _check_object_is_deleted(self):
		try:
			self._object.refresh_from_db()
			self.fail('Object not properly deleted after activation')
		except self.model_class.DoesNotExist:
			pass


	def test_cant_activate_with_invalid_key(self):
		self._response = self._request_activation(key='boguskey')
		self.assertTrue(request_denied(self._response))
		self._after_failed_activation()
		self._after_activation_attempt()


	def _after_failed_activation(self):
		self._check_object_is_not_deleted()


	def _check_object_is_not_deleted(self):
		try:
			self._object.refresh_from_db()
		except self.model_class.DoesNotExist:
			self.fail('Object has been prematurely deleted')



class ImageTestCommon:
	'''
	Methods shared by the various tests that involve images. Requires a list of width properties, .image_widths, to be set.
	'''

	def _full_image_path(self, filename, width):
		return os.path.join(
			self.image_dest_path_root,
			width_dir_name(width),
			filename,
		)


	def _image_filename_once_uploaded(self):
		object = self.model_class.objects.get()
		return object.image.filename


	def _check_images_have_correct_widths(self, filename):
		for expected_width in self.image_widths:
			if expected_width == MultisizeImage.FULL_SIZE:
				continue

			image_path = self._full_image_path(filename, expected_width)

			image = Image.open(image_path)
			actual_width, _ = image.size
			image.close()

			self.assertEqual(expected_width, actual_width)


	def _check_image_files_are_deleted(self, image_filename):
		for width in self.image_widths:
			former_image_path = os.path.join(
				self.image_dest_path_root,
				width_dir_name(width),
				image_filename,
			)
			self.assertFalse(os.path.exists(former_image_path))


	def _check_image_widths_for_multiple_filenames(self, *filename_list):
		for filename in filename_list:
			self._check_images_have_correct_widths(filename)


	def _check_images_deleted_for_multiple_filenames(self, *filename_list):
		for filename in filename_list:
			self._check_image_files_are_deleted(filename)


	def _clean_files(self, filename):
		for width in self.image_widths:
			os.remove(self._full_image_path(filename, width))



class ModelTestBaseWithImage(ModelTestBase, ImageTestCommon):
	'''
	Extra class variables, to be set in _init_params() of your subclass:

	image_source_path: of test image
	image_dest_path_root: not including subdirectory for the image's size
	image_widths: list of values (number of pixels, or MultisizeImageField.FULL_SIZE)
	'''

	def test_update_image(self):
		self._update_image()

		filename = self._object.image.filename
		self._check_images_have_correct_widths(filename)

		self._object.delete()


	def _update_image(self):
		image = open(self.image_source_path, 'rb')
		
		self._object.image = MultisizeImage.create_from_file(
			image,
			self.model_class.get_image_field(),
		)
		self._object.save()

		image.close()


	def test_image_nullification_deletes_files(self):
		self._update_image()
		filename = self._object.image.filename
		self._object.image = None
		self._check_image_files_are_deleted(filename)


	def test_object_deletion_deletes_files(self):
		self._update_image()
		filename = self._object.image.filename
		self._object.delete()
		self._check_image_files_are_deleted(filename)



class ModelViewTestBase(TestWithUsers):
	'''
	Subclasses must implement the _init_params() class method, in which certain class variables are to be set:

	.model_class: the model class to be tested
	.list_view_name, detail_view_name: names of views to be tested
	.fields: instance of ModelTestFields containing data for create and update operations
	.expected_permissions: a value from ModelTestPermissions
	'''


	def setUp(self):
		super().setUp()
		self._check_params()
		self._response_from_create = self._create_object(LoginDetails.STAFF)


	def _check_params(self):
		if not self.list_view_name:
			raise ViewNameError('No list view name specified; .list_view_name == None')

		if not self.detail_view_name:
			raise ViewNameError('No detail view name specified; .detail_view_name == None')

		if self.model_class == None:
			raise ModelClassError()


	@logged_in
	def _create_object(self, data=None):
		return self._client.post(
			urlresolvers.reverse(self.list_view_name),
			prep_for_request(data or self.fields.initial),
			format='json',
		)


	def test_list_objects_as_staff(self):
		self._response = self._list_objects(LoginDetails.STAFF)
		self._check_response_as_staff(self.fields.initial)


	def test_list_objects_as_nonstaff(self):
		self._response = self._list_objects(LoginDetails.NONSTAFF)
		self._check_response_as_nonstaff(ModelTestPermissions.STAFF_WRITE, self.fields.initial)


	@logged_in
	def _list_objects(self, url_args=''):
		url = urlresolvers.reverse(self.list_view_name) + url_args
		return self._client.get(url,	format='json')


	def test_create_object_as_staff(self):
		self.assertEqual(self._response_from_create.status_code, status.HTTP_201_CREATED)


	def test_create_object_as_nonstaff(self):
		self._response = self._create_object(LoginDetails.NONSTAFF)
		self._check_response_as_nonstaff(
			min_permission_for_http_ok=ModelTestPermissions.ALL_WRITE,
			expected_values=self.fields.initial,
			success_code=status.HTTP_201_CREATED,
		)


	def test_retrieve_object_as_staff(self):
		self._response = self._retrieve_object(LoginDetails.STAFF)
		self._check_response_as_staff(self.fields.initial)


	def test_retrieve_object_as_nonstaff(self):
		self._response = self._retrieve_object(LoginDetails.NONSTAFF)
		self._check_response_as_nonstaff(ModelTestPermissions.STAFF_WRITE, self.fields.initial)


	def _check_response_as_staff(
		self,
		expected_values=None,
		success_code=status.HTTP_200_OK,
	):
		self.assertEqual(self._response.status_code, success_code)

		if expected_values:
			self._check_response_for_values(expected_values)


	def _check_response_as_nonstaff(
		self,
		min_permission_for_http_ok,
		expected_values=None,
		success_code=status.HTTP_200_OK,
	):
		if self.expected_permissions < min_permission_for_http_ok:
			self.assertEqual(self._response.status_code, status.HTTP_403_FORBIDDEN)
		else:
			self.assertEqual(self._response.status_code, success_code)

			if expected_values:
				self._check_response_for_values(expected_values)


	def _check_response_for_values(
		self,
		dict,
		status_code=status.HTTP_200_OK,
	):
		for val in dict.values():
			self.assertContains(
				self._response,
				string_representation_in_response(val),
				status_code=status_code,
			)


	@logged_in
	def _retrieve_object(self, pk=None):
		return self._client.get(
			self._get_object_url(pk),
			format='json',
		)


	def _get_object_url(self, pk=None):
		if pk is None:
			object = self.model_class.objects.first()
			pk = object.pk

		return urlresolvers.reverse(self.detail_view_name, kwargs={'pk': pk})


	def test_update_object_as_staff(self):
		self._response = self._update_object(LoginDetails.STAFF)
		self._check_response_as_staff(self.fields.changed)


	def test_update_object_as_nonstaff(self):
		self._response = self._update_object(LoginDetails.NONSTAFF)
		self._check_response_as_nonstaff(
			min_permission_for_http_ok=ModelTestPermissions.ALL_WRITE,
			expected_values=self.fields.changed,
		)


	@logged_in
	def _update_object(self):
		return self._client.put(
			self._get_object_url(),
			prep_for_request(self.fields.changed),
			format='json',
		)


	@logged_in
	def _partially_update_object(self, data):
		return self._client.patch(
			self._get_object_url(),
			prep_for_request(data),
			format='json',
		)


	def test_destroy_object_as_staff(self):
		self._response = self._destroy_object(LoginDetails.STAFF)
		self._check_response_as_staff(None, status.HTTP_204_NO_CONTENT)


	def test_destroy_object_as_nonstaff(self):
		self._response = self._destroy_object(LoginDetails.NONSTAFF)
		self._check_response_as_nonstaff(
			min_permission_for_http_ok=ModelTestPermissions.ALL_WRITE,
			expected_values=None,
			success_code=status.HTTP_204_NO_CONTENT,
		)


	@logged_in
	def _destroy_object(self, pk=None):
		return self._client.delete(
			self._get_object_url(pk),
			format='json',
		)


	def _check_response_object_id_is(self, id):
		self.assertEqual(
			self._get_response_object_id(),
			id,
		)


	def _get_response_object_id(self, response=None):
		response = response or self._response
		self.assertTrue('id' in response.data)
		return response.data['id']



class ModelViewTestBaseWithImage(ModelViewTestBase, ImageTestCommon):
	'''
	Extra class variables, to be set in _init_params() of your subclass:

	image_source_path: of test image
	image_dest_path_root: not including subdirectory for the image's size
	image_widths: list of values (number of pixels, or MultisizeImageField.FULL_SIZE)
	'''

	def setUp(self):
		super().setUp()

		self._object = self.model_class.objects.first()
		self._filenames_for_deletion = []


	def tearDown(self):
		self.model_class.objects.all().delete()
		super().tearDown()
	
	
	def test_update_image(self):
		self._update_image()
		self.assertEqual(self._response_from_update.status_code, status.HTTP_200_OK)
		self._check_image_files_exist()
		self._clean_files()


	def _update_image(self, object=None):
		image = open(self.image_source_path, mode='rb')
		self._response_from_update = self._request_image_change(image, object)
		image.close()


	def _check_image_files_exist(self):
		self._object.refresh_from_db()
		image = self._object.image

		for width in image.get_widths():
			path = image.abs_image_path(width)
			self.assertTrue(
				os.path.isfile(path),
			)


	def _clean_files(self, filename=None):
		if filename:
			super()._clean_files(filename)
		else:
			self._request_image_change(image=None)


	def _request_image_change(self, image, object=None):
		object = object or self._object

		request_data = {
			'image': image,
		}
		request_format = 'multipart' if image else 'json'

		self._client.login(**LoginDetails.STAFF)
		response = self._client.put(
			urlresolvers.reverse(self.detail_view_name, kwargs={'pk': object.id}),
			request_data,
			request_format,
		)
		self._client.logout()

		return response


	def test_remove_image(self):
		self._update_image()
		
		image_filename = self._image_filename_once_uploaded()
		
		response_from_removal = self._request_image_change(image=None)
		self.assertEqual(response_from_removal.data['image'], None)

		self._check_image_files_are_deleted(image_filename)


	def test_image_alteration_on_multiple_objects(self):
		response_from_second_create = self._create_object(LoginDetails.STAFF)

		for object in self.model_class.objects.all():
			self._update_image(object)

		for object in self.model_class.objects.all():
			self._request_image_change(
				image=None,
				object=object,
			)
			self._check_image_files_are_deleted(object.image.filename)


	def test_partial_update_keeps_image_files_intact(self):
		self._update_image()
		self._partially_update_object(LoginDetails.STAFF, data=None)
		self._check_image_files_exist()


	def test_destroy_object_as_staff(self):
		self._update_image()
		image_filename = self._image_filename_once_uploaded()
		super().test_destroy_object_as_staff()
		self._check_image_files_are_deleted(image_filename)


	def test_images_have_correct_widths(self):
		self._update_image()
		updated_data = self._response_from_update.data
		self._filenames_for_deletion.append(updated_data['image'])

		self.assertTrue('image' in updated_data)
		self._check_images_have_correct_widths(updated_data['image'])



class ModelTestWithOwnerMixin:

	def setUp(self):
		# User data is specific to each instance of this class, so is created here rather than in _init_params()
		self._init_users()
		self._init_additional_user()

		self.fields.initial['user'] = self._additional_user
		self.fields.changed['user'] = self._staff_user

		super().setUp()



class ModelTestBaseWithOwner(
	ModelTestWithOwnerMixin,
	TestWithUsers,
	ModelTestBase,
):
	pass



class ModelViewTestBaseWithOwner(
	ModelTestWithOwnerMixin,
	ModelViewTestBase
):

	def test_can_list_own_objects(self):
		self._response = self._list_objects(LoginDetails.ADDITIONAL)

		self.assertEqual(self._response.status_code, status.HTTP_200_OK)
		self.assertTrue(self._response.data)
		self.assertTrue(isinstance(self._response.data, list))
		self._check_response_for_values(self.fields.initial)


	def test_staff_can_filter_list_to_own_objects(self):
		self.fields.changed['user'] = self._staff_user
		staff_object = self.model_class(**self.fields.changed)
		staff_object.save()

		self._response = self._list_own_objects(LoginDetails.STAFF)

		list_from_response = self._response.data
		self.assertEqual(len(list_from_response), 1)
		self._check_response_for_values(self.fields.changed)


	@logged_in
	def _list_own_objects(self):
		url = urlresolvers.reverse(self.list_view_name) + '?ownonly'
		return self._client.get(url)


	def test_list_objects_as_nonstaff(self):
		'''
		Override. Non-staff user has no objects of its own, but should receive an empty list rather than a 403
		'''
		if hasattr(self, 'list_is_public'):
			super().test_list_objects_as_nonstaff()
			return

		response = self._list_objects(LoginDetails.NONSTAFF)

		self.assertTrue(isinstance(response.data, list))
		self.assertFalse(response.data)



class OrderedModelTestMixin:
	'''
	For testing e.g. Piece and Category, which have some index_... field to keep them in a particular order

	Subclasses must set:
	.list_index_field_name, e.g. 'index_in_cat' for Piece
	'''


	def test_object_is_created_at_end_of_list(self):
		self._populate_list()
		main_object_data = self._get_creation_data_without_list_index() # so that index can be assigned automatically
		new_object = self.model_class.objects.create(**main_object_data)
		self._check_new_object_is_at_end_of_list(new_object)


	def _populate_list(self):
		for source_data in [self.fields.initial, self.fields.changed]:
			self._create_object_with_random_index(source_data)


	def _create_object_with_random_index(self, source_fields):
		'''
		Objects are given high indices to test that the 'main', tested object is automatically given a higher one still
		'''
		index = random.randint(500, 1000)

		creation_data = self._get_creation_data_with_list_index(
			source_fields,
			index,
		)

		return self.model_class.objects.create(**creation_data)
			

	def _get_creation_data_with_list_index(
		self,
		source_fields,
		index,
	):
		creation_data = dict(source_fields)
		creation_data[self.list_index_field_name] = index
		return creation_data


	def _get_creation_data_without_list_index(self):
		return self._get_creation_data_with_list_index(
			source_fields=self.fields.initial,
			index=None,
		)


	def _check_new_object_is_at_end_of_list(self, new_object):
		list = self._get_list_containing(new_object)
		item_with_highest_index = self._get_item_with_highest_index(list)
		
		self.assertEqual(item_with_highest_index, new_object)


	def _get_list_containing(self, object):
		# e.g. filtering for pieces in the correct category
		filter_kwargs = \
			self._get_filter_kwargs_for_list_containing(object)

		return self.model_class.objects.filter(**filter_kwargs)


	def _get_filter_kwargs_for_list_containing(self, object):
		'''
		Should be overridden e.g. to ensure that only Pieces from the same Category as new object are listed
		'''
		return {}


	def _get_item_with_highest_index(self, list):
		sorted_list = list.order_by(self.list_index_field_name)
		return sorted_list.last()



class OrderedModelViewTestMixin:

	def test_reorder_as_staff(self):
		response = self._request_reorder(
			LoginDetails.STAFF,
		)
		self._check_for_reorder_success(response)


	def _request_reorder(
		self,
		login_credentials,
		**extra_props_for_every_item
	):
		item_names = [
			'Item 3',
			'Item 5',
			'Item 1',
			'Item 4',
			'Item 2',
		]

		self._pks = []

		for name in item_names:
			item_props = dict(
				extra_props_for_every_item,
				name=name,
			)

			item = self.model_class(**item_props)
			item.save()
			self._pks.append(item.pk)

		self._pks = self._get_pks_in_new_order()

		return self._send_reorder_request(login_credentials)


	def _get_pks_in_new_order(self):
		old_indices_in_new_order = [
			2, 4, 0, 3, 1,
		]

		return [self._pks[i] for i in old_indices_in_new_order]


	def _send_reorder_request(self, login_credentials):
		url = urlresolvers.reverse(self.list_view_name)
		request_data = {
			'reorder': self._pks,
		}

		self._client.login(**login_credentials)
		response = self._client.put(url, request_data, 'json')
		self._client.logout()
		return response


	def _check_for_reorder_success(self, response):
		self.assertEqual(
			response.status_code,
			status.HTTP_200_OK,
		)

		self._check_items_are_in_order(response.data)


	def _check_items_are_in_order(self, response_list):
		for item_dict, expected_pk \
				in zip(response_list, self._pks):
			self.assertTrue(isinstance(item_dict, dict))
			self.assertEqual(item_dict['id'], expected_pk)


	def test_reorder_as_nonstaff(self):
		response = self._request_reorder(
			LoginDetails.NONSTAFF,
		)

		self.assertEqual(
			response.status_code,
			status.HTTP_403_FORBIDDEN,
		)



class ModelTestPermissions:

	STAFF_ONLY = 1
	STAFF_WRITE = 2
	ALL_WRITE = 3



class ModelTestFields:

	def __init__(self):
		self.initial = dict()
		self.changed = dict()



class ModelClassError(ExceptionWithMessage):

	def __init__(self):
		super().__init__('No model type given; .model_class == None')



class ViewNameError(ExceptionWithMessage):
	pass



def prep_for_request(data):
	'''
	Value conversions necessary for sending JSON data
	'''

	if isinstance(data, dict):
		return {
			k: prep_for_request(v)
			for k, v in data.items()
		}

	if isinstance(data, Model):
		return data.pk

	return data


def width_dir_name(width):
	'''
	For image storage; e.g. piece images with width of 720px will be stored in /images/pieces/720w/.
	'''

	if width == MultisizeImage.FULL_SIZE:
		return 'fullsize'

	return str(width) + 'w'


DATETIME_RESPONSE_FORMAT = '%Y-%m-%dT%H:%M:%S'


def string_representation_in_response(val):
	'''
	Converts from a number of types to expected string representations of those types in JSON, for the sake of comparison with our actual response
	'''

	if isinstance(val, str):
		return escape_string_as_in_response(val)
	
	if isinstance(val, datetime):
		return val.strftime(
			DATETIME_RESPONSE_FORMAT,
		)

	return ''


def datetime_string(datetime):
	return datetime.strftime(DATETIME_RESPONSE_FORMAT)


def escape_string_as_in_response(string):
	translation = str.maketrans({
		'\\': r'\\',
		'\n': r'\n',
	})

	return string.translate(translation)

	
def get_activation_key_from_email(email_index=-1):
	'''
	Opens the given (or most recent) email message from the test outbox and extracts the key e.g. for registration or resetting of a password
	'''
	email_body = mail.outbox[email_index].body
	return re.findall(r'\?key\=(\w+)', email_body)[0]
