from rest_framework import generics

from ..models import Comment
from ..serializers import CommentSerializer
from ..permissions import *



class CommentViewCommon:

	serializer_class = CommentSerializer



class CommentListView(
	CommentViewCommon,
	generics.ListCreateAPIView
):

	permission_classes = (ReadOnlyExceptOwnerCreate,)


	def get_queryset(self):
		unsorted = self._get_unsorted_queryset()
		return unsorted.order_by('-datetime')


	def _get_unsorted_queryset(self):
		if 'piece' in self.request.GET:
			return self._get_piece_comment_queryset()

		if 'category' in self.request.GET:
			return self._get_category_comment_queryset()

		return Comment.objects.all()


	def _get_piece_comment_queryset(self):
		return Comment.objects.filter(
			piece__pk=self.request.GET['piece'],
		)


	def _get_category_comment_queryset(self):
		return Comment.objects.filter(
			category__pk=self.request.GET['category'],
		)



class CommentDetailView(
	CommentViewCommon,
	generics.RetrieveUpdateDestroyAPIView,
):

	permission_classes = (ReadOnlyExceptOwnerDestroy,)
	queryset = Comment.objects.all()