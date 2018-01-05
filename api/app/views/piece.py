import json

from rest_framework import status
from rest_framework.generics import *

from ..models import *
from ..serializers import *
from ..permissions import *
from . import OrderedListViewMixin



class PieceViewCommon:
	
	permission_classes = (ReadOnly,)

	
	def get_queryset(self):
		if self.request.user.is_staff:
			return Piece.objects.all()

		return Piece.objects.filter(visible=True)



class PieceListView(	
	PieceViewCommon,
	ListCreateAPIView,
	OrderedListViewMixin,
):

	serializer_class = PieceSerializerWithBasketAndOrder
	model_class = Piece
	position_field_name = 'index_in_cat'


	def perform_create(self, serializer):
		serializer.save()



class PieceDetailView(PieceViewCommon, RetrieveUpdateDestroyAPIView):

	def get_serializer_class(self):
		if 'withcategory' in self.request.GET:
			return PieceSerializerWithCategory
		return PieceSerializerWithBasketAndOrder
