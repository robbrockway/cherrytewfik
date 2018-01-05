import os.path

from django.test import TestCase

from django_config.settings import CT_IMAGE_DIR
from app.models import Exhibition
from .modeltest_base import *
from . import TEST_MEDIA_DIR



class ExhibitionTestCommon:

	@classmethod
	def _init_params(cls):
		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'name': 'Exhibition',
			'url': 'http://en.wikipedia.org/wiki/Exhibition',
			'description': 'Exhibition exhibition',
			'location': 'My house',
			'location_url': 'http://www.myhouse.com/',
			'facebook_url': 'http://www.facebook.com/sweet_new_exhibition',
			'datetime': '2018.01.01-2019.03.23 15:00-17:30',
		}

		cls.fields.changed = {
			'name': 'Altered exhibition',
			'url': 'http://en.wikipedia.org/wiki/Pottery',
			'description': 'Altered exhibition altered exhibition',
			'location': 'Your house',
			'location_url': 'http://www.yourhouse.com/',
			'facebook_url': 'http://www.facebook.com/other_exhibition',
			'datetime': '2018.05.03-2018.08.17 21:00-02:00',
		}

		cls.model_class = Exhibition

		cls.image_source_path = os.path.join(
			TEST_MEDIA_DIR,
			'resize_test.jpg',
		)

		cls.image_dest_path_root = os.path.join(
			CT_IMAGE_DIR,
			'exhibitions',
		)

		cls.image_widths = [150, 300]



class ExhibitionTest(
	ExhibitionTestCommon,
	ModelTestBaseWithImage,
	TestCase,
):
	pass



class ExhibitionViewTest(
	ExhibitionTestCommon,
	ModelViewTestBaseWithImage,
	TestCase,
):
	
	@classmethod
	def _init_params(cls):
		super()._init_params()
		cls.list_view_name = 'exhibition_list'
		cls.detail_view_name = 'exhibition_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_WRITE
