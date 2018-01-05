from rest_framework.views import APIView
from rest_framework.response import Response

import braintree



class NewClientTokenView(APIView):

	def post(self, request, *args, **kwargs):
		request.session['braintree_client_token'] = \
			braintree.ClientToken.generate()

		return Response()

