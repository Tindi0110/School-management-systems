"""
accounts/views.py

Authentication and account management API views.
Provides endpoints for login, registration, email verification,
password reset, and staff approval workflow.
"""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from datetime import timedelta
import random
from sms.mail import EmailService
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer, UserSerializer
from .permissions import IsAdminOrRegistrar

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
                EmailService.send_async('Password Reset Request — School Management System', body, email)
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
        
        # Notify user that verification is successful
        body = (
            f"Hello {user.username},\n\n"
            f"Your email address has been successfully verified.\n\n"
            f"NOTE: As a staff member, your account still requires administrator approval before you can log in. "
            f"You will receive another email once your account is approved.\n\n"
            f"— School Management System"
        )
        try:
            EmailService.send_async('Email Verified — School Management System', body, user.email)
        except Exception:
            logger.exception("Failed to send verification success email to %s", user.email)

        return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)


class VerifyEmailOTPView(APIView):
    """Verify an email using a 6-digit OTP code."""

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp = request.data.get('otp', '').strip()

        if not email or not otp:
            return Response({'error': 'Email and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_email_verified:
            return Response({'message': 'Email is already verified.'}, status=status.HTTP_200_OK)

        if str(user.email_verification_otp) != str(otp):
            return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.email_verification_otp_created_at or timezone.now() > user.email_verification_otp_created_at + timedelta(hours=24):
            return Response({'error': 'Verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Success - mark as verified and clear OTP
        user.is_email_verified = True
        user.email_verification_otp = None
        user.email_verification_otp_created_at = None
        user.save()

        # Notify user that verification is successful
        body = (
            f"Hello {user.username},\n\n"
            f"Your email address has been successfully verified.\n\n"
            f"NOTE: As a staff member, your account still requires administrator approval before you can log in. "
            f"You will receive another email once your account is approved.\n\n"
            f"— School Management System"
        )
        try:
            EmailService.send_async('Email Verified — School Management System', body, user.email)
        except Exception:
            logger.exception("Failed to send verification success email to %s", user.email)

        return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)


class ResendVerificationEmailView(APIView):
    """
    Admin/Registrar endpoint to resend the verification email to an unverified user.
    """
    permission_classes = [IsAdminOrRegistrar]

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, is_email_verified=False)
        except User.DoesNotExist:
            return Response({'error': 'User not found or already verified.'}, status=status.HTTP_404_NOT_FOUND)

        otp = str(random.randint(100000, 999999))
        user.email_verification_otp = otp
        user.email_verification_otp_created_at = timezone.now()
        user.save()

        body = (
            f"Hello {user.first_name or user.username},\n\n"
            f"Your verification code is: {otp}\n\n"
            f"Please enter this 6-digit code to verify your email address.\n"
            f"This code will expire in 24 hours.\n\n"
            f"— School Management System"
        )
        try:
            EmailService.send_async('Verify Your Email — School Management System', body, user.email)
            return Response({'message': f'Verification email resent to {user.email}.'})
        except Exception:
            logger.exception("Failed to resend verification email to %s", user.email)
            return Response({'error': 'Failed to send email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResendVerificationEmailPublicView(APIView):
    """
    Public endpoint for an unverified user to request a new verification email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()
        if not email:
            return Response({'error': 'Email address is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email, is_email_verified=False)
        except User.DoesNotExist:
            # Return success to prevent email enumeration attacks
            return Response({'message': 'If the account exists and is unverified, a verification link has been sent.'})

        otp = str(random.randint(100000, 999999))
        user.email_verification_otp = otp
        user.email_verification_otp_created_at = timezone.now()
        user.save()

        body = (
            f"Hello {user.first_name or user.username},\n\n"
            f"You requested a new verification code. Your verification code is: {otp}\n\n"
            f"Please enter this 6-digit code to verify your email address.\n"
            f"This code will expire in 24 hours.\n\n"
            f"— School Management System"
        )
        try:
            EmailService.send_async('Verify Your Email — School Management System', body, user.email)
            return Response({'message': 'If the account exists and is unverified, a verification email has been sent.'})
        except Exception:
            logger.exception("Failed to resend verification email to %s (Public)", user.email)
            return Response({'error': 'Failed to send email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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

        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Try to authenticate first (Single DB query/hit)
        user = authenticate(request, username=email, password=password)

        if not user:
            # 2. Only if authentication fails, check why (Optional diagnostic queries)
            user_exists = User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists()
            if not user_exists:
                return Response({'error': 'Account not found. Please register first.'}, status=status.HTTP_404_NOT_FOUND)
            return Response({'error': 'Incorrect password. Please try again.'}, status=status.HTTP_401_UNAUTHORIZED)

        # 3. Fast-path for successful authentication
        if not user.is_email_verified:
            return Response({'error': 'Please verify your email before logging in.'}, status=status.HTTP_403_FORBIDDEN)

        if not user.is_approved:
            return Response({'error': 'Your account is pending administrator approval.'}, status=status.HTTP_403_FORBIDDEN)

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
        user = serializer.save()
        
        # Fast check for first user bootstrap
        if user.pk == User.objects.order_by('pk').values_list('pk', flat=True).first():
            user.is_email_verified = True
            user.is_approved = True
            user.role = User.Role.ADMIN
            user.save(update_fields=['is_email_verified', 'is_approved', 'role'])
            logger.info("Bootstrap: Automatically approved first user %s as ADMIN", user.email)

        otp = str(random.randint(100000, 999999))
        user.email_verification_otp = otp
        user.email_verification_otp_created_at = timezone.now()
        user.save(update_fields=['email_verification_otp', 'email_verification_otp_created_at'])

        body = (
            f"Hello {user.first_name or user.username},\n\n"
            f"Your verification code is: {otp}\n\n"
            f"Please enter this 6-digit code to verify your email address.\n"
            f"This code will expire in 24 hours.\n\n"
            f"— School Management System"
        )
        EmailService.send_async('Verify Your Email — School Management System', body, user.email)


# Permissions moved to permissions.py

class StaffApprovalView(APIView):
    """
    Admin/Registrar endpoint to list, approve, or reject pending staff accounts.
    GET    /api/auth/staff-approval/           → list pending users
    POST   /api/auth/staff-approval/<user_id>/ → approve a specific user
    DELETE /api/auth/staff-approval/<user_id>/ → reject (delete) a specific user
    """

    permission_classes = [IsAdminOrRegistrar]

    def get(self, request):
        pending = User.objects.filter(is_approved=False, role__in=['ADMIN', 'TEACHER', 'PRINCIPAL', 'DEPUTY', 'DOS', 'REGISTRAR', 'ACCOUNTANT', 'NURSE', 'WARDEN', 'LIBRARIAN', 'DRIVER']).order_by('date_joined')
        return Response(UserSerializer(pending, many=True).data)

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        user.is_approved = True
        user.save() # Triggers create_staff_profile signal which sends the email
        logger.info("Account %s approved by %s", user.email, request.user.email)
        return Response({'message': f'{user.email} has been approved.'})

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id, is_approved=False)
        except User.DoesNotExist:
            return Response({'error': 'Pending user not found.'}, status=status.HTTP_404_NOT_FOUND)

        email = user.email
        user.delete()
        logger.info("Account %s rejected and deleted by %s", email, request.user.email)
        return Response({'message': f'Registration for {email} has been rejected and the account removed.'}, status=status.HTTP_204_NO_CONTENT)
