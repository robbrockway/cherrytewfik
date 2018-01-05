from collections import deque
from datetime import *
import re
from functools import total_ordering

from django.db import models

import rest_framework.fields

from .nullable_date import *



@total_ordering
class ExhibitionDateTime(NullableDate):
	'''
	Special date/time format for exhibitions. Includes:

	– Start and end dates (start_ and end_ year, month and day, each of which can be null to allow for vagueness)
	– Start and end times (start_ and end_ hour and minute, each of which can again be null). These are meant to be times *within* one day, repeated over several days in the case of a date range.

	Intelligent formatting ('every June', 'September-October 2018', 'Tue 24th Apr 2012', '8.30pm-midnight') is left to the frontend; this class just encodes/decodes for the database.
	'''

	DATETIME_FORMAT = '%s.%s.%s-%s.%s.%s %s:%s-%s:%s'
	DATETIME_FORMAT_REGEX = re.compile(
		r'^([0-9]{4}|null)\.([0-9]{2}|null)\.([0-9]{2}|null)'
		'\-([0-9]{4}|null)\.([0-9]{2}|null)\.([0-9]{2}|null) '
		'([0-9]{2}|null)\:([0-9]{2}|null)\-([0-9]{2}|null)\:([0-9]{2}|null)$'
	)

	# Each name points to a member variable of this class
	DATE_FIELD_NAMES = [
		'start_year',
		'start_month',
		'start_day',
		'end_year',
		'end_month',
		'end_day',
	]

	ALL_FIELD_NAMES = DATE_FIELD_NAMES + [
		'start_hour',
		'start_minute',
		'end_hour',
		'end_minute',
	]


	YEAR_RANGE = (1000, 10000)
	MONTH_RANGE = (1, 13)
	DAY_RANGE = (1, 32)
	HOUR_RANGE = (0, 24)
	MINUTE_RANGE = (0, 60)

	VALID_NUM_RANGES = {	
		'start_year': YEAR_RANGE,
		'start_month': MONTH_RANGE,
		'start_day': DAY_RANGE,
		'end_year': YEAR_RANGE,
		'end_month': MONTH_RANGE,
		'end_day': DAY_RANGE,
		'start_hour': HOUR_RANGE,
		'start_minute': MINUTE_RANGE,
		'end_hour': HOUR_RANGE,
		'end_minute': MINUTE_RANGE,
	}

	# Default value: all null, here represented as a string
	NULL_STRING = 'null' + 'null'.join('..-.. :-:') + 'null'

	
	def __init__(self, *args, **kwargs):
		'''
		Takes each property listed in self.ALL_FIELD_NAMES, as either a positional argument (in order) or a keyword argument.
		'''

		args_list = deque(args)

		for key in self.ALL_FIELD_NAMES:
			if args_list:
				value = args_list.popleft()
			else:
				value = kwargs.get(key)

			setattr(self, key, value)


	def __setattr__(self, key, value):
		self._check_new_value_is_in_range(key, value)

		if key in self.DATE_FIELD_NAMES:
			self._check_dates_are_right_way_around_with(key, value)

		super().__setattr__(key, value)


	def _check_new_value_is_in_range(self, key, value):
		if value is None:
			return

		if value not in range(*self.VALID_NUM_RANGES[key]):
			raise DateRangeError(key, value)


	def _check_dates_are_right_way_around_with(self, key, value):
		'''
		Imagines setting a particular value, then checks to see whether the new hypothetical date/time is valid
		'''

		new_dict = self._get_copied_dict()
		new_dict[key] = value

		for unit in ['year', 'month', 'day']:
			start_value = new_dict.get('start_' + unit)
			end_value = new_dict.get('end_' + unit)

			if start_value is None or end_value is None:
				continue

			if start_value < end_value:
				return

			if start_value > end_value:
				raise ValueError('Start date must precede end date')


	def _get_copied_dict(self):
		'''
		All data, as dictionary
		'''
		return {
			k: v for k, v in self.__dict__.items()
			if k in self.ALL_FIELD_NAMES
		}


	def __str__(self):
		return self.DATETIME_FORMAT % self._get_str_values_tuple()


	def _get_str_values_tuple(self):
		'''
		Returns all the required values for final rendition to a single string, minus punctuation
		'''
		return tuple(
			[self._get_str_value(key) for key in self.ALL_FIELD_NAMES]
		)


	def _get_str_value(self, key):
		value = getattr(self, key)
		if value is None:
			return 'null'

		str_value = str(value)

		if key in ('start_year', 'end_year'):
			return str_value	# with no padding

		return str_value.zfill(2) # otherwise, two digits


	@classmethod
	def create_from_string(cls, string):
		matches = re.findall(
			cls.DATETIME_FORMAT_REGEX,
			string or cls.NULL_STRING,
		)[0]

		initial_values = [
			cls._get_field_value_from_string(match)
			for match in matches
		]

		return cls(*initial_values)


	def __eq__(self, other):
		return self._get_copied_dict() == other._get_copied_dict()


	def __lt__(self, other):
		field_names = [
			'start_year',
			'start_month',
			'start_day',
			'start_hour',
			'start_minute',
		]

		for field_name in field_names:
			self_field = getattr(self, field_name)
			other_field = getattr(other, field_name)

			if self._values_are_discrete_and_not_none(self_field, other_field):
				return self_field < other_field

			if self_field is None and other_field is not None:
				return True

			if self_field is not None and other_field is None:
				return False

		return False


	def _values_are_discrete_and_not_none(
		self,
		first_value,
		second_value
	):
		return (
			first_value is not None
			and second_value is not None
			and first_value != second_value
		)



class ExhibitionDateTimeField(NullableDateField):
	
	date_class = ExhibitionDateTime


	def db_type(self, connection):
		return 'VARCHAR(49)'



class ExhibitionDateTimeSerializerField(NullableDateSerializerField):
	
	date_class = ExhibitionDateTime