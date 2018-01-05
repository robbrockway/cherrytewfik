from rest_framework import generics

from ..models import String
from ..serializers import StringTableSerializer
from ..permissions import ReadOnly



class StringViewCommon:

	queryset = String.objects.all()
	serializer_class = StringTableSerializer
	permission_classes = (ReadOnly,)



class StringListView(
	StringViewCommon,
	generics.ListCreateAPIView,
):
	pass



class StringDetailView(
	StringViewCommon,
	generics.RetrieveUpdateDestroyAPIView,
):
	pass