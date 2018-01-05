from rest_framework import generics

from ..models import Exhibition
from ..serializers import ExhibitionSerializer
from ..permissions import ReadOnly



class ExhibitionViewCommon:

	queryset = Exhibition.objects.all()
	serializer_class = ExhibitionSerializer
	permission_classes = (ReadOnly,)



class ExhibitionListView(
	ExhibitionViewCommon,
	generics.ListCreateAPIView,
):

	def perform_create(self, serializer):
		serializer.save()



class ExhibitionDetailView(
	ExhibitionViewCommon,
	generics.RetrieveUpdateDestroyAPIView,
):
	pass
