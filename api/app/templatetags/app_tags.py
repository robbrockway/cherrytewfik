import latex

from django.template import Library
from django.utils.html import mark_safe


register = Library()
@register.filter('escapetex')
def escape_latex(value):
	return mark_safe(latex.escape(value))
