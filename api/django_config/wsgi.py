'''
WSGI config for Cherry Tewfik's web API
'''

import os


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_config.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

