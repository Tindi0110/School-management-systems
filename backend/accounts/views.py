from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model, authenticate

User = get_user_model()

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email=email).first()
        if user:
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
            
            try:
                subject = 'Password Reset Request - School Management System'
                message = f"Hello,\n\nClick the link below to reset your password:\n\n{reset_link}\n\nBest regards,\nSystem Administration"
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            except Exception as e:
                return Response({'error': 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        return Response({'message': 'If an account exists, a reset link has been sent.'}, status=status.HTTP_200_OK)

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            new_password = request.data.get('password')
            if not new_password:
                return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid token or User ID'}, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.is_email_verified = True
            user.save()
            return Response({'message': 'Email verified successfully!'}, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid verification link'}, status=status.HTTP_400_BAD_REQUEST)

class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        email = request.data.get('username') # DRF ObtainAuthToken uses 'username' field name by default in its internal logic if not subclassed carefully, but we can just use our own authenticate
        password = request.data.get('password')
        
        user = authenticate(request, username=email, password=password) # Since USERNAME_FIELD is 'email', authenticate expects 'username' arg to be the email value
        
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not user.is_email_verified:
            return Response({'error': 'Email not verified. Please check your inbox.'}, status=status.HTTP_403_FORBIDDEN)
            
        if not user.is_approved:
            return Response({'error': 'Your account is pending administrator approval.'}, status=status.HTTP_403_FORBIDDEN)
            
        token, created = Token.objects.get_or_create(user=user)
        user_serializer = UserSerializer(user)
        return Response({
            'token': token.key,
            'user': user_serializer.data
        })

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save()
        # Send verification email
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verify_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}"
        
        try:
            subject = 'Verify Your Email - School Management System'
            message = f"Hello,\n\nPlease verify your email by clicking the link below:\n\n{verify_link}\n\nThank you!"
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        except Exception:
            pass # In production we should handle this, but here we don't block registration

class StaffApprovalView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        pending_users = User.objects.filter(is_approved=False, is_email_verified=True)
        serializer = UserSerializer(pending_users, many=True)
        return Response(serializer.data)

    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            user.is_approved = True
            user.save()
            return Response({'message': f'User {user.email} approved successfully.'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
