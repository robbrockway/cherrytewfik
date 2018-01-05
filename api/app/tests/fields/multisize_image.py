import os.path
import shutil
from PIL import Image

from django.test import TestCase
from django.core.management.color import no_style
from django.db import models

from app.fields.multisize_image import *
from app.models import ModelBase
from app.utils import *
from django_config.settings import BASE_DIR, CT_IMAGE_DIR
from .test_model import TestModel



TEST_IMAGE_WIDTHS = [
	MultisizeImage.FULL_SIZE,
	540, 270,
]

TEST_IMAGE_DIR_NAME = 'test_images'

TEST_IMAGE_PATH = os.path.join(
	BASE_DIR,
	'app',
	'tests',
	'media',
	'resize_test.jpg',
)

IMAGE_UPLOAD_ROOT = os.path.join(
	CT_IMAGE_DIR,
	TEST_IMAGE_DIR_NAME,
)

TEST_FIELD = MultisizeImageField(
	null=True,
	widths=TEST_IMAGE_WIDTHS,
	root_dir=TEST_IMAGE_DIR_NAME,
)


class MultisizeImageTestCommon:

	def _check_files_exist_at_correct_widths(self, filename):
		for expected_width in TEST_IMAGE_WIDTHS:
			path = self._get_path_at_width(expected_width, filename)
	
			if expected_width == MultisizeImage.FULL_SIZE:
				self.assertTrue(os.path.isfile(path))
			else:
				image = Image.open(path)
				actual_width, _ = image.size
				self.assertEqual(expected_width, actual_width)
	

	def _check_files_are_deleted(self, filename):
		for width in TEST_IMAGE_WIDTHS:
			path = self._get_path_at_width(
				width,
				filename,
			)
			self.assertFalse(os.path.exists(path))

	
	def _get_path_at_width(self, width, filename):
		width_dir = self._abs_width_dir(width)
		return os.path.join(
			width_dir,
			filename,
		)
	
	
	def _abs_width_dir(self, width):
		width_dir_name = \
			MultisizeImage.width_dir_name(width)
	
		return os.path.join(
			IMAGE_UPLOAD_ROOT,
			width_dir_name,
		)
	
	
	def _clear_uploaded_test_images(self):
		if os.path.exists(IMAGE_UPLOAD_ROOT):
			shutil.rmtree(IMAGE_UPLOAD_ROOT)
	


class MultisizeImageTest(TestCase, MultisizeImageTestCommon):

	def setUp(self):
		self._image_file = open(TEST_IMAGE_PATH, 'rb')

		self._multisize_image = MultisizeImage.create_from_file(
			self._image_file,
			TEST_FIELD,
		)

		self._multisize_image.save_to_filesystem()

	
	def tearDown(self):
		self._image_file.close()
		self._clear_uploaded_test_images()


	def test_width_dir_names(self):
		self.assertEqual(
			MultisizeImage.width_dir_name(MultisizeImage.FULL_SIZE),
			'fullsize',
		)

		self.assertEqual(
			MultisizeImage.width_dir_name(300),
			'300w',
		)

		self.assertEqual(
			MultisizeImage.width_dir_name(3249),
			'3249w',
		)


	def test_image_saves_at_correct_widths(self):
		self._check_files_exist_at_correct_widths(
			self._multisize_image.filename
		)




class MultisizeImageTestModel(TestModel):

	class Meta:
		managed = False


	image = TEST_FIELD



class MultisizeImageFieldTest(TestCase, MultisizeImageTestCommon):

	def setUp(self):
		self._clear_uploaded_test_images()
		MultisizeImageTestModel.create_table()

		self._image_file = open(TEST_IMAGE_PATH, 'rb')

		multisize_image = MultisizeImage.create_from_file(
			self._image_file,	
			TEST_FIELD,
		)

		self._object = MultisizeImageTestModel(image=multisize_image)
		self._object.save()


	def tearDown(self):
		self._image_file.close()
		self._clear_uploaded_test_images()
		MultisizeImageTestModel.delete_table()


	def test_image_saves_at_correct_widths(self):
		self._check_files_exist_at_correct_widths(
			self._object.image.filename
		)


	def test_nullification_clears_image_files(self):
		filename = self._object.image.filename
		self._object.image = None
		self._object.save()
		self._check_files_are_deleted(filename)


	def test_object_deletion_clears_image_files(self):
		filename = self._object.image.filename
		self._object.delete()
		self._check_files_are_deleted(filename)
