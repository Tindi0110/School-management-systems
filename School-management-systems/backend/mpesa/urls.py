from django.urls import path
from .views import InitiateSTKPushView, MpesaCallbackView

urlpatterns = [
    path('push/', InitiateSTKPushView.as_view(), name='mpesa-push'),
    path('callback/', MpesaCallbackView.as_view(), name='mpesa-callback'),
]
