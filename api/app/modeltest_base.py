from enum import Enum
import os.path
import re
import json
from PIL import Image

import django
from django.core import urlresolvers
from django.contrib.auth.models import User

from rest_framework.test import APIClient
from rest_framework import status

from .fields.multisize_image import *
from .utils import ExceptionWithMessage



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

		self.object = self.model_class(**self.fields.initial)
	

	def test_add_object(self):
		old_count = self.model_class.objects.count()
		self.object.save()
		new_count = self.model_class.objects.count()
		self.assertNotEqual(old_count, new_count)



class ImageTestCommon:

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

			image_path = os.path.join(
				self.image_dest_path_root,
				width_dir_name(expected_width),
				filename,
			)

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



class ModelTestBaseWithImage(ModelTestBase, ImageTestCommon):
	'''
	Extra class variables, to be set in _init_params() of your subclass:

	image_source_path: of test image
	image_dest_path_root: not including subdirectory for the image's size
	image_widths: list of values (number of pixels, or MultisizeImageField.FULL_SIZE)
	'''

	def test_update_image(self):
		self._update_image()

		filename = self.object.image.filename
		self._check_images_have_correct_widths(filename)

		self.object.delete()


	def _update_image(self):
		image = open(self.image_source_path, 'rb')
		
		self.object.image = MultisizeImage.create_from_file(
			image,
			self.model_class.get_image_field(),
		)
		self.object.save()

		image.close()


	def test_image_nullification_deletes_files(self):
		self._update_image()
		filename = self.object.image.filename
		self.object.image = None
		self._check_image_files_are_deleted(filename)


	def test_object_deletion_deletes_files(self):
		self._update_image()
		filename = self.object.image.filename
		self.object.delete()
		self._check_image_files_are_deleted(filename)



class ModelViewTestBase:
	'''
	Subclasses must implement the _init_params() class method, in which certain class variables are to be set:

	.model_class: the model class to be tested
	.list_view_name, detail_view_name: names of views to be tested
	.fields: instance of ModelTestFields containing data for create and update operations
	.expected_permissions: a value from ModelTestPermissions
	'''

	STAFF_CREDENTIALS = {
		'username': 'stafftest',
		'password': 'passymcwordface',
	}
	
	NONSTAFF_CREDENTIALS = {
		'username': 'nonstafftest',
		'password': 'wordymcpassface',
	}


	@classmethod
	def setUpTestData(cls):
		cls._init_params()


	def setUp(self):
		self._check_params()
		self.client = APIClient()

		staff_create_kwargs = dict(self.STAFF_CREDENTIALS, is_staff=True)
		self.staff_user = User.objects.create_user(**staff_create_kwargs)
		self.nonstaff_user = User.objects.create_user(**self.NONSTAFF_CREDENTIALS)

		self.response_from_create = self._create_object(self.STAFF_CREDENTIALS)


	def _check_params(self):
		if not self.list_view_name:
			raise ViewNameError('No list view name specified; .list_view_name == None')

		if not self.detail_view_name:
			raise ViewNameError('No detail view name specified; .detail_view_name == None')

		if self.model_class == None:
			raise ModelClassError()


	def test_list_objects_as_staff(self):
		self.response = self._list_objects(self.STAFF_CREDENTIALS)
		self._check_response_as_staff(self.fields.initial)


	def test_list_objects_as_nonstaff(self):
		self.response = self._list_objects(self.NONSTAFF_CREDENTIALS)
		self._check_response_as_nonstaff(ModelTestPermissions.STAFF_WRITE, self.fields.initial)


	def _list_objects(self, login_credentials):
		self.client.login(**login_credentials)
		response = self.client.get(
			urlresolvers.reverse(self.list_view_name),
			format='json',
		)
		self.client.logout()
		return response


	def test_create_object_as_staff(self):
		self.assertEqual(self.response_from_create.status_code, status.HTTP_201_CREATED)


	def test_create_object_as_nonstaff(self):
		self.response = self._create_object(self.NONSTAFF_CREDENTIALS)
		self._check_response_as_nonstaff(
			ModelTestPermissions.ALL_WRITE,
			self.fields.initial,
			status.HTTP_201_CREATED,
		)


	def _create_object(self, login_credentials, data = None):
		data = data or self.fields.initial

		self.client.login(**login_credentials)
		response = self.client.post(
			urlresolvers.reverse(self.list_view_name),
			data,
			format='json',
		)
		self.client.logout()
		return response


	def test_retrieve_object_as_staff(self):
		self.response = self._retrieve_object(self.STAFF_CREDENTIALS)
		self._check_response_as_staff(self.fields.initial)


	def test_retrieve_object_as_nonstaff(self):
		self.response = self._retrieve_object(self.NONSTAFF_CREDENTIALS)
		self._check_response_as_nonstaff(ModelTestPermissions.STAFF_WRITE, self.fields.initial)


	def _check_response_as_staff(self, expected_strings = None, success_code = status.HTTP_200_OK):
		self.assertEqual(self.response.status_code, success_code)

		if expected_strings:
			self._check_response_for_string_values(expected_strings)


	def _check_response_as_nonstaff(self, min_permission, expected_strings = None, success_code = status.HTTP_200_OK):
		if self.expected_permissions < min_permission:
			self.assertEqual(self.response.status_code, status.HTTP_403_FORBIDDEN)
		else:
			self.assertEqual(self.response.status_code, success_code)

			if expected_strings:
				self._check_response_for_string_values(expected_strings)


	def _check_response_for_string_values(self, dict):
		for val in dict.values():
			if type(val) is str:
				self.assertContains(self.response, val)


	def _retrieve_object(self, login_credentials):
		object = self.model_class.objects.first()

		self.client.login(**login_credentials)
		response = self.client.get(
			urlresolvers.reverse(self.detail_view_name, kwargs={'pk': object.id}),
			format='json',
		)
		self.client.logout()
		return response


	def test_update_object_as_staff(self):
		self.response = self._update_object(self.STAFF_CREDENTIALS)
		self._check_response_as_staff(self.fields.changed)


	def test_update_object_as_nonstaff(self):
		self.response = self._update_object(self.NONSTAFF_CREDENTIALS)
		self._check_response_as_nonstaff(ModelTestPermissions.ALL_WRITE, self.fields.changed)


	def _update_object(self, login_credentials):
		object = self.model_class.objects.get()

		self.client.login(**login_credentials)
		response = self.client.put(
			urlresolvers.reverse(self.detail_view_name, kwargs={'pk': object.id}),
			self.fields.changed,
			format='json',
		)
		self.client.logout()
		return response


	def test_destroy_object_as_staff(self):
		self.response = self._destroy_object(self.STAFF_CREDENTIALS)
		self._check_response_as_staff(None, status.HTTP_204_NO_CONTENT)


	def test_destroy_object_as_nonstaff(self):
		self.response = self._destroy_object(self.NONSTAFF_CREDENTIALS)
		self._check_response_as_nonstaff(
			ModelTestPermissions.ALL_WRITE,
			None,
			status.HTTP_204_NO_CONTENT,
		)


	def _destroy_object(self, login_credentials):
		object = self.model_class.objects.get()

		self.client.login(**login_credentials)
		response = self.client.delete(
			urlresolvers.reverse(self.detail_view_name, kwargs={'pk': object.id}),
			format='json',
		)
		self.client.logout()
		return response



class ModelViewTestBaseWithImage(ModelViewTestBase, ImageTestCommon):
	'''
	Extra class variables, to be set in _init_params() of your subclass:

	image_source_path: of test image
	image_dest_path_root: not including subdirectory for the image's size
	image_widths: list of values (number of pixels, or MultisizeImageField.FULL_SIZE)
	'''

	def setUp(self):
		super().setUp()

		self.object = self.model_class.objects.get()
	
	
	def test_update_image(self):
		self._update_image()
		self.assertEqual(self.response_from_update.status_code, status.HTTP_200_OK)
		self._clean_files()


	def _update_image(self, object=None):
		image = open(self.image_source_path, mode='rb')
		self.response_from_update = self._request_image_change(image, object)
		image.close()

		self.updated_data = json.loads(self.response_from_update.content)


	def _clean_files(self, filename=None):
		if filename:
			for width in self.image_widths:
				os.remove(self._full_image_path(filename, width))
		else:
			self._request_image_change(image=None)


	def _request_image_change(self, image, object=None):
		object = object or self.object

		request_data = {
			'image': image,
		}
		request_format = 'multipart' if image else 'json'

		self.client.login(**self.STAFF_CREDENTIALS)
		response = self.client.put(
			urlresolvers.reverse(self.detail_view_name, kwargs={'pk': object.id}),
			request_data,
			request_format,
		)
		self.client.logout()

		return response


	def test_remove_image(self):
		self._update_image()
		
		image_filename = self._image_filename_once_uploaded()
		
		response_from_removal = self._request_image_change(image=None)
		removal_response_dict = json.loads(response_from_removal.content)
		self.assertEqual(removal_response_dict['image'], None)

		self._check_image_files_are_deleted(image_filename)


	def test_image_alteration_on_multiple_objects(self):
		response_from_second_create = self._create_object(self.STAFF_CREDENTIALS)

		for object in self.model_class.objects.all():
			self._update_image(object)

		for object in self.model_class.objects.all():
			self._request_image_change(
				image=None,
				object=object,
			)
			self._check_image_files_are_deleted(object.image.filename)


	def test_destroy_object_as_staff(self):
		self._update_image()
		image_filename = self._image_filename_once_uploaded()
		super().test_destroy_object_as_staff()
		self._check_image_files_are_deleted(image_filename)


	def test_images_have_correct_widths(self):
		self._update_image()
		self.assertTrue('image' in self.updated_data)

		self._check_images_have_correct_widths(self.updated_data['image'])



class OrderedModelViewTestMixin:

	def test_reorder_as_staff(self):
		response = self._request_reorder(
			self.STAFF_CREDENTIALS,
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

		self.pks = []

		for name in item_names:
			item_props = dict(
				extra_props_for_every_item,
				name=name,
			)

			item = self.model_class(**item_props)
			item.save()
			self.pks.append(item.pk)

		self.pks = self._get_pks_in_new_order()

		return self._send_reorder_request(login_credentials)


	def _get_pks_in_new_order(self):
		old_indices_in_new_order = [
			2, 4, 0, 3, 1,
		]

		return [self.pks[i] for i in old_indices_in_new_order]


	def _send_reorder_request(self, login_credentials):
		url = urlresolvers.reverse(self.list_view_name)
		request_data = {
			'reorder': self.pks,
		}

		self.client.login(**login_credentials)
		response = self.client.put(url,	request_data, 'json')
		self.client.logout()
		return response


	def _check_for_reorder_success(self, response):
		self.assertEqual(
			response.status_code,
			status.HTTP_200_OK,
		)

		self._check_items_are_in_order(
			json.loads(response.content),
		)


	def _check_items_are_in_order(self, response_list):
		for item_dict, expected_pk \
				in zip(response_list, self.pks):
			self.assertTrue(isinstance(item_dict, dict))
			self.assertEqual(item_dict['id'], expected_pk)


	def test_reorder_as_nonstaff(self):
		response = self._request_reorder(
			self.NONSTAFF_CREDENTIALS,
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



def width_dir_name(width):
	if width == MultisizeImage.FULL_SIZE:
		return 'fullsize'

	return str(width) + 'w'


