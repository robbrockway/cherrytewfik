from smtplib import SMTPException

from django.core.mail import EmailMessage
from django.contrib.auth.models import AnonymousUser

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.serializers import ValidationError

from django_config.settings import CT_ADMIN_EMAIL



class ContactView(APIView):

	def post(self, request, *args, **kwargs):
		if not request.data.get('message'):
			raise ValidationError('Message is empty')

		email_message = EmailMessage(
			request.data.get('subject', ''),
			request.data['message'],
			self._get_full_sender_email_address(),
			to=(CT_ADMIN_EMAIL,),
		)

		try:
			email_message.send()
		except SMTPException:
			raise ValidationError(
				'Error sending email. Is '
				'CT_CONTACT_FORM_TARGET_ADDRESS '
				'set correctly?',
			)

		return Response('Sent')


	def _get_full_sender_email_address(self):
		user = self.request.user

		if not isinstance(user, AnonymousUser):
			sender_name = ' '.join([user.first_name, user.last_name])
			sender_email = user.email
		elif not self.request.data.get('sender_email'):
			raise ValidationError('No sender email')
		else:
			sender_name = self.request.data.get('sender_name')
			sender_email = self.request.data['sender_email']

		if sender_name:
			return '%s <%s>' % (sender_name, sender_email)

		return sender_email
