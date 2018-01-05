from datetime import date, time

from django.test import TestCase

from app.fields.exhibition_datetime import *
from .test_model import TestModel



TEST_VALUES = {
	'start_year': 2020,
	'start_month': 4,
	'start_day': None,
	'end_year': 2021,
	'end_month': 1,
	'end_day': 20,
	'start_hour': 18,
	'start_minute': 0,
	'end_hour': 21,
	'end_minute': 30,
}


TEST_VALUES_WITH_NEGATIVE_DATE_SPAN = {
	'start_year': 2020,
	'start_month': 4,
	'start_day': 12,
	'end_date': 2019,
	'end_month': 3,
	'end_day': 2,
}


INVALID_TEST_VALUES = {
	'start_month': 0,
	'start_day': 0,
	'end_month': 13,
	'end_day': 32,
	'start_hour': -7,
	'start_minute': -1,
	'end_hour': 24,
	'end_minute': 60,
}


TEST_STRING = '2018.02.12-2019.03.30 23:09-01:42'


class ExhibitionDateTimeTest(TestCase):

	def test_create(self):
		test_datetime = ExhibitionDateTime(
			**TEST_VALUES,
		)

		for param_name in TEST_VALUES.keys():
			actual_value = getattr(test_datetime, param_name)
			expected_value = TEST_VALUES[param_name]

			self.assertEqual(
				actual_value,
				expected_value,
			)


	def test_create_from_null_string(self):
		test_datetime = ExhibitionDateTime.create_from_string(None)
		self.assertEqual(
			str(test_datetime),
			ExhibitionDateTime.NULL_STRING,
		)


	def test_string_converts_back_to_itself(self):
		test_datetime = ExhibitionDateTime.create_from_string(
			TEST_STRING,
		)

		self.assertEqual(
			str(test_datetime),
			TEST_STRING,
		)


	def test_invalid_numbers_raise_errors(self):
		for param_name, value in INVALID_TEST_VALUES.items():
			creation_kwarg = {param_name: value}
			try:
				test_datetime = ExhibitionDateTime(**creation_kwarg)
				self.fail(
					'Invalid %s of %i should raise DateRangeError'
					% (param_name, value)
				)
			except DateRangeError:
				pass


	def test_negative_date_span_raises_error(self):
		try:
			test_datetime = ExhibitionDateTime(
				**TEST_VALUES_WITH_NEGATIVE_DATE_SPAN,
			)
			self.fail('Negative date span should raise ValueError')
		except ValueError:
			pass



class ExhibitionDateTimeTestModel(TestModel):

	class Meta:
		managed = False
		abstract = False


	datetime = ExhibitionDateTimeField()



class ExhibitionDateTimeFieldTest(TestCase):

	def setUp(self):
		ExhibitionDateTimeTestModel.create_table()

		self._test_datetime = ExhibitionDateTime(
			**TEST_VALUES,
		)

		self._object = ExhibitionDateTimeTestModel(
			datetime=self._test_datetime,
		)
		self._object.save()


	def tearDown(self):
		ExhibitionDateTimeTestModel.delete_table()


	def test_values_are_stored_correctly(self):
		retrieved_object = \
			ExhibitionDateTimeTestModel.objects.get()

		self.assertEqual(
			retrieved_object.datetime,
			self._test_datetime,
		)
