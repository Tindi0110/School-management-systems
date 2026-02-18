from rest_framework.pagination import PageNumberPagination


class LargeResultsSetPagination(PageNumberPagination):
    """
    Custom pagination that allows clients to request up to 20,000 records
    via the `page_size` query parameter. Falls back to 50 if not specified.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 20000
