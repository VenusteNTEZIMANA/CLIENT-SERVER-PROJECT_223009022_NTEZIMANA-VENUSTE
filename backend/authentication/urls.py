
from django.urls import path
from .views import SupabaseMeView


urlpatterns = [
    path(
        "me/",
        SupabaseMeView.as_view(),
        name="auth-me",
    ),
]