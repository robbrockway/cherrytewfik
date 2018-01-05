from django.test import TestCase
from django.core import mail, urlresolvers

from rest_framework import status

from . import TestWithUsers, LoginDetails, logged_in



class ContactViewTest(
	TestWithUsers,
	TestCase,
):

	DEFAULT_REQUEST_DATA = {
		'sender_name': 'Testy McTestface',
		'sender_email': 'testy@mctestface.com',
		'subject': 'Test message',
		'message': 'Testing testing testing\ntesting',
	}


	def test_can_send_message_logged_in(self):
		self._check_can_send_message(
			LoginDetails.NONSTAFF,
			sender_name=None,
			sender_email=None,
		)


	def _check_can_send_message(self, login_details=None, **request_data):
		request_data = dict(
			self.DEFAULT_REQUEST_DATA,
			**request_data,
		)

		response = self._send_message(login_details, **request_data)
		
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(mail.outbox)
		
		sent_message = mail.outbox[0]

		self.assertEqual(
			sent_message.subject,
			request_data.get('subject', '')
		)

		self.assertEqual(
			sent_message.body,
			request_data.get('message', '')
		)


	@logged_in
	def _send_message(self, **request_data):
		return self._client.post(
			urlresolvers.reverse('contact'),
			request_data,
			format='json',
		)


	def test_can_send_message_logged_out(self):
		self._check_can_send_message()


	def test_cant_send_message_logged_out_without_return_address(self):
		self._check_cant_send_message(sender_email=None)


	def _check_cant_send_message(self, login_details=None, **request_data):
		request_data = dict(
			self.DEFAULT_REQUEST_DATA,
			**request_data,
		)

		response = self._send_message(login_details, **request_data)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertFalse(mail.outbox)


	def test_cant_send_empty_message(self):
		self._check_cant_send_message(
			login_details=LoginDetails.NONSTAFF,
			sender_name=None,
			sender_email=None,
			message='',
		)
