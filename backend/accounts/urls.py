from django.urls import path
from .views import (
    RegisterView, CustomAuthToken, PasswordResetRequestView, PasswordResetConfirmView,
    StaffApprovalView, ResendVerificationEmailView, ResendVerificationEmailPublicView,
    VerifyEmailView, VerifyEmailOTPView
)


urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomAuthToken.as_view(), name='login'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset-confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('staff-approval/', StaffApprovalView.as_view(), name='staff_approval_list'),
    path('staff-approval/<int:user_id>/', StaffApprovalView.as_view(), name='staff_approval_detail'),
    path('resend-verification/<int:user_id>/', ResendVerificationEmailView.as_view(), name='resend_verification_admin'),
    path('resend-verification/public/', ResendVerificationEmailPublicView.as_view(), name='resend_verification_public'),
    path('verify-email/<uidb64>/<token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('verify-email-otp/', VerifyEmailOTPView.as_view(), name='verify_email_otp'),
]
