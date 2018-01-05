from django.db import models

import rest_framework.fields

from .nullable_date import *



class PieceDate(NullableDate):
	'''
	Date format for pieces. Stores a year and an optional month. Rendered to text (for database or JSON) as YYYY-MM or YYYY-null.
	'''

	def __init__(self, year, month=None):
		self.year = year
		self.month = month


	def __setattr__(self, key, value):
		if key == 'month':
			self._check_month_is_valid(value)
		elif key == 'year':
			self._check_year_is_valid(value)

		super().__setattr__(key, value)


	def __eq__(self, other):
		return (
			isinstance(other, PieceDate)
			and self.year == other.year
			and self.month == other.month
		)


	def _check_month_is_valid(self, value):
		if value is not None and value > 12:
			raise DateRangeError('month', value)


	def _check_year_is_valid(self, value):
		if value is None:
			raise ValueError(
				'Year cannot be null',
			)


	def __str__(self):
		return '%i-%s' % (
			self.year,
			self._get_month_string()
		)


	def _get_month_string(self):
		if self.month is None:
			return 'null'

		unpadded_string = str(self.month)
		return unpadded_string.zfill(2)	# two digits


	@classmethod
	def create_from_string(cls, string):
		if string is None:
			return None

		parts = string.split('-')
		
		params = (
			cls._get_field_value_from_string(part) for part in parts
		)
		
		return cls(*params)



class PieceDateField(NullableDateField):

	date_class = PieceDate

	
	def db_type(self, connection):
		return 'VARCHAR(9)'



class PieceDateSerializerField(NullableDateSerializerField):
	
	date_class = PieceDate