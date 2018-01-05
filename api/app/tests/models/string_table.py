from django.test import TestCase

from app.models import String
from .modeltest_base import *



class StringTestCommon:

	@classmethod
	def _init_params(cls):
		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'key': 'string1',
			'value': 'Stringy stringy string',
		}

		cls.fields.changed = {
			'key': 'string2',
			'value': 'Other string',
		}

		cls.model_class = String



class StringTest(
	StringTestCommon,
	ModelTestBase,
	TestCase,
):
	pass



class StringViewTest(
	StringTestCommon,
	ModelViewTestBase,
	TestCase,
):

	@classmethod
	def _init_params(cls):
		super()._init_params()

		cls.list_view_name = 'string_list'
		cls.detail_view_name = 'string_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_WRITE
