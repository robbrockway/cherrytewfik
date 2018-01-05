from django.test import TestCase

from app.models import Piece



class RandomPKTest(TestCase):

	def test_pks_are_not_in_sequence(self):
		first = Piece.objects.create()
		second = Piece.objects.create()

		self.assertTrue(first.pk and second.pk)
		self.assertNotEqual(first.pk + 1, second.pk)

