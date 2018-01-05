import os, os.path
from PIL import Image
from resizeimage import resizeimage

from django.db import models
from django import forms
from django.core.files.uploadedfile import UploadedFile

import rest_framework.fields
from rest_framework import serializers

from django_config.settings import CT_IMAGE_DIR
from ..utils import *



VALID_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
]

IMAGE_FILE_EXTENSION_MAP = {
	'PNG': 'png',
	'JPEG': 'jpg',
}


class MultisizeImage:

	FULL_SIZE = -1


	def __init__(self, field, file=None, filename=None):
		self._field = field
		self.file = file
		self.filename = filename


	@classmethod
	def create_from_file(cls, file, field):
		return cls(field, file)


	@classmethod
	def create_from_filename(cls, filename, field):
		return cls(field, None, filename)


	def get_widths(self):
		return self._field.widths


	def save_to_filesystem(self):
		if self.file is not None:
			self.delete_files()
			self._save_at_all_widths(self.file)


	def delete_files(self):
		if self._has_previous_image():
			for width in self._field.widths:
				self._delete_file_of_width(width)


	def _has_previous_image(self):
		return bool(self.filename)


	def _delete_file_of_width(self, width):
		path = self.abs_image_path(width)
		if os.path.isfile(path):
			os.remove(path)


	def abs_image_path(self, width, filename=None):
		filename = filename or self.filename

		return os.path.join(
			CT_IMAGE_DIR,
			self._field.root_dir,
			self.width_dir_name(width),
			filename,
		)


	def _save_at_all_widths(self, file):
		self._full_size_image = Image.open(file)
		self.file_extension = IMAGE_FILE_EXTENSION_MAP[self._full_size_image.format]
		self.filename = self._create_unique_filename()

		for width in self._field.widths:
			self._save_at_width(width)


	def _create_unique_filename(self):
		content_type = self._full_size_image.format
		
		while True:
			filename = "%s.%s" % (
				random_string(),
				self.file_extension,
			)

			if not self._filename_is_used(filename):
				return filename


	def _filename_is_used(self, filename):
		for width in self._field.widths:
			path = self.abs_image_path(width, filename)
			if os.path.exists(path):
				return True

		return False


	@classmethod
	def width_dir_name(cls, width):
		if width == cls.FULL_SIZE:
			return 'fullsize'

		return str(width) + 'w'


	def _save_at_width(self, width):
		self._check_for_image_data()

		if self._should_resize(min_width=width):
			final_image = resizeimage.resize_width(
				self._full_size_image,
				width,
			)
		else:
			final_image = self._full_size_image

		path = self.abs_image_path(width)
		self._save_image(final_image, path)


	def _check_for_image_data(self):
		assert self._full_size_image, 'No image data present'
		assert self.filename, 'No filename given'


	def _should_resize(self, min_width):
		return self._image_is_wider_than(min_width) \
			and min_width != self.FULL_SIZE


	def _image_is_wider_than(self, width):
		full_width, _ = self._full_size_image.size
		return full_width > width


	def _save_image(self, image, path):
		dir_name = os.path.dirname(path)
		if not os.path.exists(dir_name):
			os.makedirs(dir_name)

		image.save(path)



class MultisizeImageField(models.Field):
	
	description = (
		'Stores multiple copies of an image file, each reduced '
		'to a given width or kept unaltered if already narrower.'
		' Represented in DB as a filename, without directory, '
		'which in actuality is <images>/<root_dir>/<width>w/ for '
		'each width, or <images>/<root_dir>/fullsize/ if width '
		'== FULL_SIZE.'
	)
	
	MAX_FILENAME_LENGTH = 64


	def __init__(self, **kwargs):
		self.widths = kwargs.pop('widths', None)
		self.root_dir = kwargs.pop('root_dir', None)

		self.file_extension = None
		self.filename = None
		self._full_size_image = None

		super().__init__(**kwargs)


	def deconstruct(self):
		name, path, args, kwargs = super().deconstruct()

		kwargs['widths'] = self.widths
		kwargs['root_dir'] = self.root_dir

		return name, path, args, kwargs


	def db_type(self, connection):
		return 'VARCHAR(%i)' % self.MAX_FILENAME_LENGTH


	def formfield(self, **kwargs):
		defaults = {'form_class': forms.FileField}
		defaults.update(kwargs)

		return super().formfield(**defaults)

	
	def pre_save(self, model_instance, add):
		multisize_image = getattr(
			model_instance,
			self.name,
		)
	
		if multisize_image:
			multisize_image.save_to_filesystem()

		return super().pre_save(model_instance, add)
	

	def from_db_value(self, value, *args):
		return MultisizeImage.create_from_filename(value, self)


	def get_prep_value(self, value):
		if isinstance(value, MultisizeImage):
			return value.filename
		else:
			return value

		
	def to_python(self, value):
		if isinstance(value, MultisizeImage):
			return value
		elif value is None:
			return None
		else:
			raise TypeError(
				'Field \'%s\' requires MultisizeImage value, not %s'
					% (self.name, type(value).__name__)
			)


	def check_for_multisize_data(self):
		if not self._has_widths():
			raise TypeError(
				'No image widths given, or wrong type. Supply as '
				'list of numbers, through \'widths\' keyword argument.'
			)

		if not self._has_root_dir():
			raise TypeError(
				'No root directory given, or wrong type. Supply '
				'as string, through \'root_dir\' keyword argument.'
			)
		

	def _has_widths(self):
		return self.widths and isinstance(self.widths, list)


	def _has_root_dir(self):
		return self.root_dir and isinstance(self.root_dir, str)



class MultisizeImageSerializerField(rest_framework.fields.Field):
	
	default_error_messages = {
		'incorrect_type': 
			'Incorrect type: expected app.fields.multisize_image.'
			'MultisizeImage; got {input_type}.',
		'incorrect_format':
			'Incorrect image format; must be PNG or JPG, not {format}.',
		'no_model_field':
			'Could not find the associated MultisizeImageField',
	}


	def __init__(self, **kwargs):
		super().__init__(**self._get_kwargs_with_input_type(kwargs))


	def _get_kwargs_with_input_type(self, initial_kwargs):
		style = initial_kwargs.get('style', dict())
		style['input_type'] = 'file'
		initial_kwargs['style'] = style
		return initial_kwargs


	def to_representation(self, value):
		if isinstance(value, MultisizeImage):
			return value.filename
		elif isinstance(value, str):
			return value
		else:
			return None


	def to_internal_value(self, file):
		if file is None:
			return None

		self._validate_file(file)

		return MultisizeImage.create_from_file(
			file,
			self._get_model_field(),
		)


	def _validate_file(self, file):
		if not isinstance(file, UploadedFile):
			self.fail('incorrect_type', input_type=type(file))
		if not self._file_extension_is_valid(file):
			self.fail('incorrect_format', format=file.content_type)


	def _file_extension_is_valid(self, file):
		return file.content_type in VALID_IMAGE_TYPES


	def _get_model_field(self):
		model_field = self.parent.serializer_field_to_model_field(self)
		if not model_field:
			self.fail('no_model_field')

		return model_field
