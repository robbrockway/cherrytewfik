from django.db import connection
from django.db.utils import OperationalError

from app.models import ModelBase



class TestModel(ModelBase):
	'''
	Models are needed for testing custom fields; this is their base class.
	'''

	class Meta:
		managed = False
		abstract = True


	@classmethod
	def create_table(cls):
		'''
		Overrides default database operation; we don't want a table here!
		'''
		with connection.schema_editor() as schema_editor:
			try:
				schema_editor.delete_model(cls)
			except OperationalError:
				pass

			schema_editor.create_model(cls)


	@classmethod
	def delete_table(cls):
		with connection.schema_editor() as schema_editor:
			schema_editor.delete_model(cls)
