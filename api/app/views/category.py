from rest_framework import generics
from rest_framework.response import Response

from ..models import Category, Piece
from ..fields.multisize_image import MultisizeImage
from ..serializers import CategorySerializer, PieceSerializer
from ..permissions import ReadOnly
from . import OrderedListViewMixin



class CategoryViewCommon:

	queryset = Category.objects.all()
	serializer_class = CategorySerializer
	permission_classes = (ReadOnly,)



class CategoryListView(
	CategoryViewCommon,
	generics.ListCreateAPIView,
	OrderedListViewMixin,
):

	model_class = Category
	position_field_name = 'index_in_list'


	def perform_create(self, serializer):
		serializer.save()



class CategoryDetailView(
	CategoryViewCommon,
	generics.RetrieveUpdateDestroyAPIView,
):

	queryset = Category.objects.all()
	serializer_class = CategorySerializer
	permission_classes = (ReadOnly,)


	def post(self, request, *args, **kwargs):
		if self._request_has_images(request):
			return self._post_multiple_images(request)

		return super().post(request, *args, **kwargs)


	def _request_has_images(self, request):
		return request.FILES and 'images[]' in request.FILES


	def _post_multiple_images(self, request):
		pk_list = []
		all_images = request.FILES.getlist('images[]')
		
		for image in all_images:
			multisize_image = MultisizeImage.create_from_file(
				image,
				Piece.get_image_field(),
			)

			new_piece = \
				self._create_piece_in_current_category(multisize_image)

			new_piece.save()
			pk_list.append(new_piece.pk)

		return self._create_piece_list_response(pk_list)


	def _create_piece_in_current_category(self, multisize_image):
		return Piece(
			category=self.get_object(),
			image=multisize_image,
		)


	def _create_piece_list_response(self, pk_list):
		pieces = Piece.objects.filter(pk__in=pk_list)
		serializer = PieceSerializer(pieces, many=True)
		return Response(serializer.data)