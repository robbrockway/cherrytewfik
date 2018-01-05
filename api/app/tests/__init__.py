from datetime import datetime, timedelta

from rest_framework import status
from rest_framework.test import APIClient



class LoginDetails:

	STAFF = {
		'username': 'stafftest',
		'password': 'passymcwordface',
	}
	
	NONSTAFF = {
		'username': 'nonstafftest',
		'password': 'wordymcpassface',
	}

	ADDITIONAL = {
		'username': 'additional',
		'password': 'faceymcwordpass',
	}



def logged_in(func):
	'''
	Decorator. The given function (member of a ViewTestBase instance) will be performed whilst logged in using a 'login_details' dictionary, added to the start of the function's arguments. This dictionary contains 'username' and 'password' strings.
	'''
	def wrapper(self, login_details=None, *args, **kwargs):
		if login_details:
			self._client.login(**login_details)

		result = func(self, *args, **kwargs)

		if login_details:
			self._client.logout()

		return result

	return wrapper



class TestWithUsers:
	'''
	Base class for tests that use a ._staff_user and a ._nonstaff_user, and may use an ._additional_user after calling ._init_additional_user(). Is extended by ModelViewTestBase.
	'''

	STAFF_PROFILE = dict(
		LoginDetails.STAFF,
		email='staff@user.com',
		first_name='Staffy',
		last_name='Stafferson',
		is_staff=True
	)

	NONSTAFF_PROFILE = dict(
		LoginDetails.NONSTAFF,
		email='nonstaff@user.com',
		first_name='Nonstaffy',
		last_name='Nonstafferson',
	)

	ADDITIONAL_PROFILE = dict(
		LoginDetails.ADDITIONAL,
		email='additional@user.com',
		first_name='Additional',
		last_name='User',
	)

	GUEST_EMAIL_ADDRESS = 'guest@address.com'


	@classmethod
	def setUpTestData(cls):
		cls._init_params()


	@classmethod
	def _init_params(cls):
		pass


	def setUp(self):
		self._init_users()
		self._client = APIClient()
		super().setUp()

	
	def _init_users(self):
		if not hasattr(self, '_staff_user'):
			self._staff_user = User.objects.create_user(
				**self.STAFF_PROFILE,
			)

		if not hasattr(self, '_nonstaff_user'):
			self._nonstaff_user = User.objects.create_user(
				**self.NONSTAFF_PROFILE,
			)


	def _init_additional_user(self):
		if not hasattr(self, '_additional_user'):
			self._additional_user = User.objects.create_user(
				**self.ADDITIONAL_PROFILE,
			)


	def _empty_put(self, url):
		return self._client.put(
			url,
			data=None,
		)


	def _get_session_key(self):
		return self._client.session.session_key



def request_denied(response):
	return response.status_code == status.HTTP_401_UNAUTHORIZED \
		or response.status_code == status.HTTP_403_FORBIDDEN


def ancient_time():
	return datetime(1, 1, 1)


def is_in_last_minute(datetime_instance):
	now = datetime.now()
	minute = timedelta(minutes=1)

	return now - datetime_instance < minute


from .email import *
from .auth import *
from .contact import *
from .invoice import *
