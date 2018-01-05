from django.test import TestCase

from app.fields.piece_date import *

from .test_model import TestModel


YEAR = 2017
MONTH = 11


TEST_STRING = '2017-11'
TEST_STRING_WITH_NULL_MONTH = '2017-null'


class PieceDateTest(TestCase):

	def setUp(self):
		self._test_date = PieceDate(YEAR, MONTH)


	def test_create(self):
		self.assertEqual(self._test_date.year, YEAR)
		self.assertEqual(self._test_date.month, MONTH)


	def test_cant_set_year_to_null(self):
		try:
			self._test_date.year = None
			self.fail('Setting year to None should raise error')
		except ValueError:
			pass


	def test_can_set_month_to_null(self):
		self._test_date.month = None


	def test_cant_set_month_to_invalid_number(self):
		try:
			self._test_date.month = 13
			self.fail(
				'Setting month to number out of range '
				'should raise error'
			)
		except DateRangeError:
			pass


	def test_string_converts_back_to_itself(self):
		test_date = PieceDate.create_from_string(TEST_STRING)
		self.assertEqual(str(test_date), TEST_STRING)


	def test_string_with_null_month_converts_back_to_itself(self):
		test_date = PieceDate.create_from_string(
			TEST_STRING_WITH_NULL_MONTH,
		)

		self.assertEqual(
			str(test_date),
			TEST_STRING_WITH_NULL_MONTH,
		)



class PieceDateTestModel(TestModel):

	class Meta:
		managed = False
		abstract = False


	date = PieceDateField()



class PieceDateFieldTest(TestCase):

	def setUp(self):
		PieceDateTestModel.create_table()

		self._test_date = PieceDate(YEAR, MONTH)
		self._object = PieceDateTestModel(date=self._test_date)
		self._object.save()


	def tearDown(self):
		PieceDateTestModel.delete_table()


	def test_values_are_stored_correctly(self):
		retrieved_object = PieceDateTestModel.objects.get()
		self.assertEqual(retrieved_object.date, self._test_date)
