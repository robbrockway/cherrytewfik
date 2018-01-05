import rest_framework.fields
from rest_framework.serializers import ValidationError

from ..models import Address



class AddressSerializerField(rest_framework.fields.CharField):
	'''
	Deserialises the PK of an Address model instance to a pure string.
	'''

	def to_internal_value(self, value):
		if isinstance(value, int):
			return self._address_from_pk(value).address

		if isinstance(value, Address):
			return value.address

		return value


	def _address_from_pk(self, pk):
		try:
			return Address.objects.get(pk=pk)
		except Address.DoesNotExist:
			raise ValidationError(
				'Address #%i does not exist' % pk,
			)
