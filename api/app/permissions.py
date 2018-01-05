import json
from json.decoder import JSONDecodeError

from django.contrib.auth.models import User, AnonymousUser

from rest_framework import permissions

from .models import Order



class ReadOnly(permissions.BasePermission):

	def has_permission(self, request, view):
		return request.method in permissions.SAFE_METHODS \
			or request.user.is_staff



class OwnerCanRetrieveAndDestroy(permissions.BasePermission):

	OWNER_ALLOWED_METHODS = \
		permissions.SAFE_METHODS + ('DELETE',)


	def has_object_permission(self, request, view, object):
		return request.user.is_staff \
			or request.method in self.OWNER_ALLOWED_METHODS \
				and is_made_by_owner(request, object)



class CreateOnly(permissions.BasePermission):

	def has_permission(self, request, view):
		return request.method == 'POST' \
			or request.user.is_staff



class OwnerCreateOnly(permissions.BasePermission):
	'''
	Only open to non-staff in the case of creating an object with the user themselves as owner, either explicitly (user's ID in request data) or implicitly (no user ID).
	'''

	def has_permission(self, request, view):
		return request.user.is_staff \
			or self._is_creation_with_self_as_owner(request)

	
	def _is_creation_with_self_as_owner(self, request):
		return request.method == 'POST' and (
			not request.data.get('user')
			or request.data['user'] == request.user.pk
		)



class ReadOnlyExceptOwnerCreate(OwnerCreateOnly):

	def has_permission(self, request, view):
		return request.method in permissions.SAFE_METHODS \
			or super().has_permission(request, view)



class ReadOnlyExceptOwnerDestroy(ReadOnly):

	def has_permission(self, request, view):
		return super().has_permission(request, view) \
			or request.method == 'DELETE'

	
	def has_object_permission(self, request, view, object):
		if request.method == 'DELETE':
			return is_made_by_owner(request, object) \
				or request.user.is_staff

		return True



class OwnerRetrieveOnly(permissions.BasePermission):

	def has_permission(self, request, view):
		return request.user.is_staff \
			or request.method == 'GET'


	def has_object_permission(self, request, view, object):
		return request.user.is_staff \
			or is_made_by_owner(request, object)



class OwnerCanCreateOrRetrieve(
	OwnerCreateOnly,
	OwnerRetrieveOnly,
):

	def has_permission(self, request, view):
		return super().has_permission(request, view) \
			or request.method == 'GET'



class OwnerCanCreateRetrieveOrUpdate(OwnerCanCreateOrRetrieve):

	def has_permission(self, request, view):
		return super().has_permission(request, view) \
			or request.method in ('PUT', 'PATCH')



class PasswordResetListPermissions(OwnerCreateOnly):
	'''
	As well as owners, anybody may create a PasswordReset object if doing so with an 'email' argument.
	'''

	def has_permission(self, request, view):
		return self._is_creation_with_email_address(request) \
			or super().has_permission(request, view)


	def _is_creation_with_email_address(self, request):
		return request.method == 'POST' \
			and 'email' in request.data \
			and 'user' not in request.data
	


class OwnerCanCreateRetrieveAndDestroy(
	OwnerCanRetrieveAndDestroy,
	OwnerCreateOnly,
):

	def has_permission(self, request, view):
		return super().has_permission(request, view) \
			or request.method in self.OWNER_ALLOWED_METHODS



class ActivateOnly(permissions.BasePermission):

	def has_permission(self, request, view):
		return self._is_activation_request(request) \
			or request.user.is_staff


	def _is_activation_request(self, request):
		return request.method == 'PUT' \
			and 'activation_key' in request.data



class IsOwner(OwnerCreateOnly):

	def has_permission(self, request, view):
		allowed_methods = permissions.SAFE_METHODS \
			+ ('DELETE', 'PUT', 'PATCH')
		
		return request.method in allowed_methods \
			or super().has_permission(request, view)


	def has_object_permission(self, request, view, object):
		return request.user.is_staff \
			or is_made_by_owner(request, object)



class OrderPermission(IsOwner):

	def has_object_permission(self, request, view, object):
		return super().has_object_permission(request, view, object) \
			and not self._is_forbidden_edit(request, object)


	def _is_forbidden_edit(self, request, object):
		return request.method in ('PUT', 'PATCH') \
			and object.status == Order.DISPATCHED \
			and not request.user.is_staff



class ActivateOnlyExceptByOwner(
	ActivateOnly,
	IsOwner,
):

	def has_permission(self, request, view):
		return self._is_retrieval(request) \
			or super().has_permission(request, view)


	def _is_retrieval(self, request):
		return request.method == 'GET'



def is_made_by_owner_or_staff(request, object):
	return is_made_by_owner(request, object) \
		or request.user.is_staff


def is_made_by_owner(request, object):
	if isinstance(object, User):
		return object == request.user

	if hasattr(object, 'owner'):
		return object.owner == request.user

	return object.user == request.user \
		or is_made_by_guest_owner(request, object)


def is_made_by_guest_owner(request, object):
	return (
		isinstance(request.user, AnonymousUser)
		and getattr(object, 'session_key', None) 
			== request.session.session_key
	)
