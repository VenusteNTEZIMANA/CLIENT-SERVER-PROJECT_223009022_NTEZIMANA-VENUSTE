from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),

    # Authentication
    path(
        "api/auth/",
        include("authentication.urls"),
    ),

    # Habits
    path(
        "api/habits/",
        include("habits.urls"),
    ),

    # Check-ins
    path(
        "api/checkins/",
        include("checkins.urls"),
    ),
]