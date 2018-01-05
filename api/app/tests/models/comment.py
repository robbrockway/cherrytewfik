from datetime import datetime
from random import randint

from django.test import TestCase

from app.models import *
from app.utils import *
from .modeltest_base import *
from .. import is_in_last_minute


class CommentTestCommon:

	@classmethod
	def _init_params(cls):
		cls.fields = ModelTestFields()

		cls.fields.initial = {
			'name': 'Commenty McCommentface',
			'datetime': datetime(2012, 9, 22),
			'comment': 'Comment comment\ncomment comment',
		}

		cls.fields.changed = {
			'datetime': datetime(2011, 3, 7),
			'comment': 'Comment comment comment',
		}

		cls.model_class = Comment



class CommentTest(
	CommentTestCommon,
	TestCase,
):
	pass



class CommentViewTest(
	CommentTestCommon,
	ModelViewTestBase,
	TestCase,
):
	
	@classmethod
	def _init_params(cls):
		super()._init_params()

		cls.list_view_name = 'comment_list'
		cls.detail_view_name = 'comment_detail'
		cls.expected_permissions = ModelTestPermissions.STAFF_WRITE


	def setUp(self):
		self._init_users()

		self.fields.initial.update({
			'user': self._staff_user,
			'piece': Piece.objects.create(),
		})

		self.fields.changed.update({
			'category': Category.objects.create(),
		})

		super().setUp()


	def test_list_comments_by_piece(self):
		self._init_piece_and_category_comments()
		piece = self.fields.initial['piece']
		comment_pk_list = self._get_pk_list_from_response(
			url_args='?piece=%i' % piece.pk,
		)

		self.assertTrue(self._piece_comment.pk in comment_pk_list)
		self.assertFalse(self._category_comment.pk in comment_pk_list)


	def _get_pk_list_from_response(self, url_args):
		response = self._list_objects(url_args=url_args)
		return [dict['id'] for dict in response.data]


	def _init_piece_and_category_comments(self):
		self._piece_comment = \
			Comment.objects.get(piece=self.fields.initial['piece'])
		self._category_comment = \
			Comment.objects.create(**self.fields.changed)


	def test_list_comments_by_category(self):
		self._init_piece_and_category_comments()
		category = self.fields.changed['category']
		comment_pk_list = self._get_pk_list_from_response(
			url_args='?category=%i' % category.pk,
		)

		self.assertTrue(self._category_comment.pk in comment_pk_list)
		self.assertFalse(self._piece_comment.pk in comment_pk_list)


	def test_comment_list_is_sorted_by_date(self):
		self._init_randomly_timed_comments()

		comment_datetimes = [
			comment.datetime for comment in Comment.objects.all()
		]
		comment_datetimes.sort(reverse=True)

		expected_datetime_strings = [
			datetime_string(datetime) for datetime in comment_datetimes
		]

		response_datetime_strings = \
			self._datetime_string_list_from_response()

		self.assertEqual(
			expected_datetime_strings,
			response_datetime_strings,
		)


	def _init_randomly_timed_comments(self):
		for i in range(10):
			fields = dict(
				self.fields.initial,
				datetime=random_datetime(),
			)
			
			Comment.objects.create(**fields)


	def _datetime_string_list_from_response(self):
		response = self._list_objects()
		return [dict['datetime'] for dict in response.data]


	def test_can_post_comment_with_implicit_user_and_datetime(self):
		creation_data = {'comment': 'implicit comment'}
		self._response = self._create_object(
			LoginDetails.NONSTAFF,
			creation_data,
		)

		self.assertEqual(
			self._response.data['user'],
			self._nonstaff_user.pk,
		)

		self._check_response_datetime_is_in_last_minute()


	def _check_response_datetime_is_in_last_minute(self):
		response_datetime_string = self._response.data['datetime']
		without_fraction = response_datetime_string.split('.')[0]
		response_datetime = datetime.strptime(
			without_fraction,
			DATETIME_RESPONSE_FORMAT,
		)

		self.assertTrue(is_in_last_minute(response_datetime))


	def test_can_delete_own_comment(self):
		Comment.objects.update(user=self._nonstaff_user)

		response = self._destroy_object(LoginDetails.NONSTAFF)
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
	


def random_datetime():
	min_timestamp, max_timestamp = 0, 10**9
	timestamp = randint(min_timestamp, max_timestamp)
	return datetime.fromtimestamp(timestamp)