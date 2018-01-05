from datetime import datetime

from django.conf.urls import url, include

from rest_framework.urlpatterns import format_suffix_patterns

from app.views import * 


urlpatterns = [
	# custom login view that takes email address as username
	url(
		r'^login\/?$',
		LoginView.as_view(),
		name='login',
	),

	url(
		r'^logout\/?$',
		LogoutView.as_view(),
		name='logout',
	),

	url(
		r'^piece\/?$',
		PieceListView.as_view(),
		name='piece_list',
	),

	url(
		r'^piece\/(?P<pk>[0-9]+)$',
		PieceDetailView.as_view(),
		name='piece_detail',
	),

	url(
		r'^piece\/(?P<pk>[0-9]+)\/addtobasket\/?$',
		AddPieceToBasketView.as_view(),
		name='add_to_basket',
	),

	url(
		r'^piece\/(?P<pk>[0-9]+)\/removefrombasket\/?$',
		RemovePieceFromBasketView.as_view(),
		name='remove_from_basket',
	),

	url(
		r'^category\/?$',
		CategoryListView.as_view(),
		name='category_list',
	),

	url(
		r'^category\/(?P<pk>[0-9]+)$',
		CategoryDetailView.as_view(),
		name='category_detail',
	),

	url(
		r'^exhibition\/?$',
		ExhibitionListView.as_view(),
		name='exhibition_list',
	),

	url(
		r'^exhibition\/(?P<pk>[0-9]+)$',
		ExhibitionDetailView.as_view(),
		name='exhibition_detail',
	),

	url(
		r'^comment\/?$',
		CommentListView.as_view(),
		name='comment_list',
	),

	url(
		r'^comment\/(?P<pk>[0-9]+)$',
		CommentDetailView.as_view(),
		name='comment_detail',
	),

	url(
		r'^basket\/?$',
		BasketListView.as_view(),
		name='basket_list',
	),

	url(
		r'^basket\/(?P<pk>[0-9]+|own)$',
		BasketDetailView.as_view(),
		name='basket_detail',
	),

	url(
		r'^order\/?$',
		OrderListView.as_view(),
		name='order_list',
	),

	url(
		r'^order\/(?P<pk>[0-9]+)$',
		OrderDetailView.as_view(),
		name='order_detail',
	),

	url(
		r'^order\/(?P<pk>[0-9]+)\/place\/?$',
		OrderPlaceView.as_view(),
		name='place_order',
	),

	url(
		r'^order\/(?P<pk>[0-9]+)\/dispatch\/?$',
		OrderDispatchView.as_view(),
		name='dispatch_order',
	),

	url(
		r'^order\/(?P<pk>[0-9]+)\/removepieces\/?$',
		OrderPieceRemovalView.as_view(),
		name='remove_from_order',
	),

	url(
		r'^order\/(?P<pk>[0-9]+)\/appendbasket\/?$',
		OrderAppendView.as_view(),
		name='append_to_order',
	),

	url(
		r'^order\/(?P<pk>[0-9]+)\/invoice\/?$',
		InvoiceView.as_view(),
		name='invoice',
	),

	url(
		r'^address\/?$',
		AddressListView.as_view(),
		name='address_list',
	),

	url(
		r'^address\/(?P<pk>[0-9]+)$',
		AddressDetailView.as_view(),
		name='address_detail',
	),

	url(
		r'^user\/?$',
		UserListView.as_view(),
		name='user_list',
	),

	url(
		r'^user\/(?P<pk>[0-9]+|self)$',
		UserDetailView.as_view(),
		name='user_detail',
	),

	url(
		r'^pendinguser\/?$',
		PendingUserListView.as_view(),
		name='pending_user_list',
	),

	url(
		r'^pendinguser\/(?P<pk>[0-9]+)$',
		PendingUserDetailView.as_view(),
		name='pending_user_detail',
	),

	url(
		r'^emailchange\/?$',
		EmailChangeListView.as_view(),
		name='email_change_list',
	),

	url(
		r'^emailchange\/(?P<pk>[0-9]+)$',
		EmailChangeDetailView.as_view(),
		name='email_change_detail',
	),

	url(
		r'^passwordreset\/?$',
		PasswordResetListView.as_view(),
		name='password_reset_list',
	),

	url(
		r'^passwordreset\/(?P<pk>[0-9]+)$',
		PasswordResetDetailView.as_view(),
		name='password_reset_detail',
	),

	url(
		r'^string\/?$',
		StringListView.as_view(),
		name='string_list',
	),

	url(
		r'^string\/(?P<pk>\S+)$',
		StringDetailView.as_view(),
		name='string_detail',
	),

	url(
		r'^contact\/?$',
		ContactView.as_view(),
		name='contact',
	),

	url(
		r'^newclienttoken\/?$',
		NewClientTokenView.as_view(),
		name='new_client_token',
	),
]


urlpatterns = format_suffix_patterns(
	urlpatterns,
	allowed=['json', 'html'],
)


urlpatterns += [
	url(
		r'auth',
		include('rest_framework.urls', namespace='rest_framework'),
	),
]
