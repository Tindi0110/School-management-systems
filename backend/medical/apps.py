from django.apps import AppConfig


class MedicalConfig(AppConfig):
    name = 'medical'

    def ready(self):
        import medical.signals
