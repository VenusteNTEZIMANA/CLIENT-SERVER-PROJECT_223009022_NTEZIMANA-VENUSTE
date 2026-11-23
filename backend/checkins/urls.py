
from django.urls import path

from .views import (
    CheckInListCreateView,
    CheckInDetailView,
    LongestStreakView,
)

urlpatterns = [
    path(
        "",
        CheckInListCreateView.as_view(),
        name="checkin-list-create",
    ),
    path(
        "<int:pk>/",
        CheckInDetailView.as_view(),
        name="checkin-detail",
    ),
    path(
        "analytics/longest-streak/",
        LongestStreakView.as_view(),
        name="longest-streak",
    ),
]