'''
General purpose view for trying things out and debugging them
'''


from django.http import HttpResponse

from ..models import Piece


def sandbox_view(request):
	return HttpResponse('OK')