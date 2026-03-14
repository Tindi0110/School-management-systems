"""
accounts/views.py

Authentication and account management API views.
Provides endpoints for login, registration, email verification,
password reset, and staff approval workflow.
"""

import logging
import os

from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _decode_uid(uidb64: str):
    """Decode a base64-encoded UID, returning the User or None."""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        return User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None


import threading

def _send_mail_safe(subject: str, body: str, recipient: str) -> bool:
    """
    Send an email synchronously for debugging.
    Raises exception to be caught by the caller if it fails.
    """
    logger.info("Starting synchronous email send for %s", recipient)
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=False)
        logger.info("send_mail completed for %s", recipient)
        return True
    except Exception as e:
        logger.exception("Failed to send email to %s (subject: %s)", recipient, subject)
        raise e # Raise to be caught by the view for diagnostic reporting


# ---------------------------------------------------------------------------
# Password Reset
# ---------------------------------------------------------------------------

class PasswordResetRequestView(APIView):
    """Accept an email address and dispatch a password-reset link."""

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=email).first()
        if user:
            token = default_token_generator.make_token(user)
            uid   = urlsafe_base64_encode(force_bytes(user.pk))
            link  = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            
            logger.info("Generating password reset link for %s", email)
            
            body = (
                f"Hello,\n\n"
                f"You requested a password reset. Click the link below:\n\n"
                f"{link}\n\n"
                f"If you did not request this, you can ignore this email.\n\n"
                f"— School Management System"
            )
            
            try:
                _send_mail_safe('Password Reset Request — School Management System', body, email)
                logger.info("Email dispatch reported success for %s", email)
                return Response(
                    {'message': f'A reset link has been sent to {email}.'},
                    status=status.HTTP_200_OK,
                )
            except Exception as e:
                logger.error("Email dispatch reported failure for %s: %s", email, str(e))
                return Response(
                    {'error': f'Server error: Failed to dispatch email. Error: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {'error': 'No account found with this email address.'},
            status=status.HTTP_404_NOT_FOUND,
        )


class PasswordResetConfirmView(APIView):
    """Validate a reset token and set the user's new password."""

    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        user = _decode_uid(uidb64)

        if not user or not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get('password', '').strip()
        if not new_password:
            return Response({'error': 'A new password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successfully.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Email Verification
# ---------------------------------------------------------------------------

class VerifyEmailView(APIView):
    """Mark a user's email as verified via a tokenised link."""

    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        user = _decode_uid(uidb64)

        if not user or not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired verification link.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_email_verified = True
        user.save()
        return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------

class CustomAuthToken(ObtainAuthToken):
    """
    Token login endpoint.
    Accepts email + password. Enforces email verification and
    admin approval before issuing a token.
    """

    def post(self, request, *args, **kwargs):
        email    = request.data.get('username', '').strip()  # 'username' kept for DRF client compatibility
        password = request.data.get('password', '')

        user = authenticate(request, username=email, password=password)

        if not user:
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_email_verified:
            return Response(
                {'error': 'Please verify your email before logging in.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_approved:
            return Response(
                {'error': 'Your account is pending administrator approval.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user':  UserSerializer(user).data,
        })


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class RegisterView(generics.CreateAPIView):
    """
    Register a new user account.
    Sends an email verification link upon successful creation.
    Staff accounts additionally require admin approval.
    """

    queryset           = User.objects.all()
    serializer_class   = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user  = serializer.save()
        token = default_token_generator.make_token(user)
        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        link  = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"

        body = (
            f"Hello {user.first_name or user.username},\n\n"
            f"Please verify your email by clicking the link below:\n\n"
            f"{link}\n\n"
            f"— School Management System"
        )
        _send_mail_safe('Verify Your Email — School Management System', body, user.email)


# ---------------------------------------------------------------------------
# Staff Approval (Admin only)
# ---------------------------------------------------------------------------

class StaffApprovalView(APIView):
    """
    Admin endpoint to list and approve pending staff accounts.
    GET  /api/auth/staff-approval/           → list pending users
    POST /api/auth/staff-approval/<user_id>/ → approve a specific user
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        pending = User.objects.filter(is_approved=False, is_email_verified=True).order_by('date_joined')
        return Response(UserSerializer(pending, many=True).data)

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.is_approved = True
        user.save()
        logger.info("Admin %s approved account for %s", request.user.email, user.email)
        return Response({'message': f'{user.email} has been approved.'})
