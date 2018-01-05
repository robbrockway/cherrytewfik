from django.db import models

import rest_framework.fields



class NullableDate:
	'''
	Base class for PieceDate and ExhibitionDateTime
	'''

	@classmethod
	def _get_field_value_from_string(cls, string):
		if string == 'null':
			return None

		return int(string)



class NullableDateField(models.Field):
	'''
	Requires .date_class to be set in subclasses, to e.g. PieceDate, or ExhibitionDateTime
	'''

	def from_db_value(self, value, *args):
		return self.date_class.create_from_string(value)


	def to_python(self, value):
		if isinstance(value, self.date_class):
			return value
		elif isinstance(value, str):
			return self.date_class.create_from_string(value)
		elif value is None:
			return None
		else:
			required_type_name = self.date_class.__name__
			actual_type_name = type(value).__name__
			raise TypeError(
				'Field \'%s\' requires %s object or '
				'encoded string, not %s' % (
					self.name,
					required_type_name,
					actual_type_name,
				),
			)



class NullableDateSerializerField(rest_framework.fields.Field):
	'''
	Requires .date_class to be set, as in NullableDateField
	'''

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)

		self.default_error_messages['incorrect_type'] = (
			'Incorrect type: expected %s; got {input_type}'
			% self.date_class.__name__
		)


	def to_representation(self, value):
		'''
		Date class => string, for JSON and database
		'''
		if isinstance(value, self.date_class):
			return str(value)
		elif isinstance(value, str):
			return value
		else:
			return None


	def to_internal_value(self, value):
		'''
		string => date class, for Python
		'''
		return self.date_class.create_from_string(value)



class DateRangeError(ValueError):

	def __init__(self, key, value):
		super().__init__(
			'Value %i out of range for %s'
			% (value, key),
		)