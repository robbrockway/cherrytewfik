import os.path
import random
import string
from io import BufferedReader
from datetime import datetime, timedelta
from decimal import Decimal

from django.core.files.base import File
from django.db.models import Sum



class ExceptionWithMessage(Exception):

	def __init__(self, message):
		self.message = message



def random_string(length=8):
	'''
	Gobbledegook, for image filenames etc
	'''

	char_array = random.choices(
		string.ascii_lowercase + string.digits,
		k=length
	)

	return ''.join(char_array)


def is_file(value):
	return isinstance(value, File) \
		or isinstance(value, BufferedReader)


def remove_keys_from_list_of_dicts(dict_list, *keys):
	return [
		{k: v for k, v in dict.items() if k not in keys}
		for dict in dict_list
	]


def dict_lists_are_equal_for_nonempty_values(a, b):
	if len(a) != len(b):
		return False

	for a_dict, b_dict in zip(a, b):
		if not dicts_are_equal_for_nonempty_values(
			a_dict, b_dict,
		):
			return False

	return True


def dicts_are_equal_for_nonempty_values(a, b):
	a_scrubbed = scrub_empty_dict_values(a)
	b_scrubbed = scrub_empty_dict_values(b)

	if set(a_scrubbed.keys()) != set(b_scrubbed.keys()):
		return False

	a_defloated = floats_and_decimals_to_strings(a_scrubbed)
	b_defloated = floats_and_decimals_to_strings(b_scrubbed)

	return a_defloated == b_defloated


def scrub_empty_dict_values(dict):
	return {
		k: v for k, v in dict.items()
		if v is not None and v != ''
	}


def floats_and_decimals_to_strings(dict):
	return {
		k: 
			('%.2f' % v) if isinstance(v, float) 
			else str(v) if isinstance(v, Decimal)
			else v
		for k, v in dict.items()
	}


def piece_price_sum(queryset):
	aggregate = queryset.aggregate(Sum('price'))
	return aggregate['price__sum'] or Decimal('0.00')