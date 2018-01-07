"""
Django settings for ctapi project.

Generated by 'django-admin startproject' using Django 1.9.1.

For more information on this file, see
https://docs.djangoproject.com/en/1.9/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.9/ref/settings/
"""

import os, os.path
import posixpath

import braintree


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CT_IMAGE_DIR = os.path.join(os.path.dirname(BASE_DIR), 'images')


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '6fc063e8-6359-4ebb-8790-358ca4b69e9d'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = [
	'localhost',
	'cherrytewfik',
	'cherrytewfik.com',
	'www.cherrytewfik.com',
]


CORS_ALLOWED_HOSTS = [
	'localhost:4200',
]


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
	'rest_framework',
    'app',
]


MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
	'app.cors_middleware.CorsMiddleware',
]

ROOT_URLCONF = 'django_config.urls'

CT_TEMPLATE_DIR = os.path.join(BASE_DIR, 'app', 'templates')

CT_EMAIL_TEMPLATE_DIR = os.path.join(CT_TEMPLATE_DIR, 'email')

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
			CT_TEMPLATE_DIR,
			CT_EMAIL_TEMPLATE_DIR,
		],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'django_config.wsgi.application'


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'OPTIONS': {
			'read_default_file': os.path.join(BASE_DIR, 'mysql.conf')
		}
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = False


STATIC_URL = '/static/'

STATIC_ROOT = posixpath.join(*(BASE_DIR.split(os.path.sep) + ['static']))


REST_FRAMEWORK = {
	'DEFAULT_RENDERER_CLASSES': (
		'rest_framework.renderers.JSONRenderer',
	),
}


# The below settings may differ between installations; take extra care to get them right! Also check mysql.conf.

EMAIL_HOST = 'smtp.someemailserver.com'

EMAIL_PORT = 465

EMAIL_HOST_USER = '...'

EMAIL_HOST_PASSWORD = '...'

EMAIL_USE_SSL = True


BRAINTREE_USE_PRODUCTION_ENVIRONMENT = False

BRAINTREE_MERCHANT_ID = '...'

BRAINTREE_PUBLIC_KEY = '...'

BRAINTREE_PRIVATE_KEY = '...'



CT_FRONTEND_ROOT = 'http://localhost:3000'

CT_EMAIL_SENDER_ADDRESS = 'Cherry Tewfik Ceramics <noreply@cherrytewfik.com>'

CT_ADMIN_EMAIL = 'email@address.com'

CT_ADMIN_FIRST_NAME = 'Cherry'