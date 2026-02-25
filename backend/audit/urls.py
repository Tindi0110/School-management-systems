from django.urls import path
from .views import HealthCheckView

urlpatterns = [
    path('status/', HealthCheckView.as_view(), name='health-check'),
]
