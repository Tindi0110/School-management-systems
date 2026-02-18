from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.http import Http404

def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns standardized error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    # Checks for Django's built-in ValidationError (not DRF's)
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            return Response({'error': exc.message_dict}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': exc.messages}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check for Http404
    if isinstance(exc, Http404):
        return Response({'detail': 'Resource not found.'}, status=status.HTTP_404_NOT_FOUND)

    # If response is None, it means it's an unhandled exception (500)
    # We can handle custom exceptions here if needed
    
    if response is not None:
        # Standardize DRF ValidationError structure
        if response.status_code == 400 and isinstance(response.data, dict):
             # Ensure 'detail' or 'error' key exists for frontend
             if 'detail' not in response.data and 'error' not in response.data:
                 # Flatten if it's a list of errors for a field, or keep as dict
                 pass 
    
    return response
