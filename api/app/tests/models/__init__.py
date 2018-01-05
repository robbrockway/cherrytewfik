import os.path


TEST_ROOT_DIR = os.path.dirname(
	os.path.dirname(os.path.abspath(__file__)),
)

TEST_MEDIA_DIR = os.path.join(
	TEST_ROOT_DIR,
	'media',
)


from .category import *
from .exhibition import *
from .piece import *
from .basket import *
from .user import *
from .pending_user import *
from .email_change import *
from .password_reset import *
from .order import *
from .comment import *
from .string_table import *
