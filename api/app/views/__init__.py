import json
from contextlib import suppress

from django.http import Http404
from django.core.exceptions import ObjectDoesNotExist

from rest_framework import generics
from rest_framework.response import Response



class OrderedListViewMixin:
	'''
	Requires member variables:
	
	.model_class
	.position_field_name: with value e.g. 'index_in_cat' for Piece
	'''
	
	def put(self, request, *args, **kwargs):
		request_dict = json.loads(request.body)
		if 'reorder' in request_dict:
			return self._reorder(request_dict)

		return super().put(request, *args, **kwargs)


	def _reorder(self, request_dict):
		pks = request_dict['reorder']
		items = []

		for position_index, pk in enumerate(pks, start=1):
			item = self.model_class.objects.get(pk=pk)
			setattr(item, self.position_field_name, position_index)
			item.save()

			items.append(item)

		return self._create_list_response(items)


	def _create_list_response(self, queryset):
		serializer = self.get_serializer(queryset, many=True)
		return Response(serializer.data)



class ActivationViewMixin:
	'''
	For views that take a key and perform some sort of activation on the given object with it. Requires:

	.activation_serializer_class: may be different from main serializer_class, e.g. PendingUserView returns a full User once activated
	'''

	def update(self, request, *args, **kwargs):
		if 'activation_key' in request.data:
			return self._activation_response(request)

		return super().update(request, *args, **kwargs)


	def _activation_response(self, request):
		key = request.data['activation_key']
		object = self._get_object_without_auth()
		resulting_object = object.try_activation(key)

		self._after_activation(resulting_object)

		serializer = self.activation_serializer_class(resulting_object)
		return Response(serializer.data)


	def _get_object_without_auth(self):
		with suppress(NotAuthenticated):
			return self.get_object()

		with suppress(ObjectDoesNotExist):
			return self.queryset.get(pk=self.kwargs['pk'])

		raise Http404()

	
	def _after_activation(self, resulting_object):
		pass



class OwnerSensitiveListViewMixin:
	'''
	Filters to owner's own items, unless they're staff, who can force the filter using the '?ownonly' request argument.
	'''

	def get_queryset(self):
		if self._should_show_all():
			return super().get_queryset()

		if self._should_show_none():
			return super().get_queryset()[:0]

		query_params = (
			{'session_key': self._get_session_key()}
			if isinstance(self.request.user, AnonymousUser) else
			{'user': self.request.user}
		)

		return super().get_queryset().filter(**query_params)


	def _get_session_key(self):
		return self.request.session.session_key


	def _should_show_all(self):
		return self.request.user.is_staff \
			and 'ownonly' not in self.request.GET


	def _should_show_none(self):
		return isinstance(self.request.user, AnonymousUser) \
			and not self._get_session_key()



class SessionSensitiveViewMixin:

	def _get_session_key(self):
		session = self.request.session

		if session.session_key is None:
			session.save()

		return session.session_key



from .auth import *
from .piece import *
from .category import *
from .comment import *
from .exhibition import *
from .basket import *
from .order import *
from .address import *
from .user import *
from .string_table import *
from .pending_user import *
from .email_change import *
from .password_reset import *
from .new_client_token import *
from .contact import *
from .invoice import *
