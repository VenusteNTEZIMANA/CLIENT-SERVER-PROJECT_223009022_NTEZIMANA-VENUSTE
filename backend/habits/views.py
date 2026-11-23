
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Habit
from .serializers import HabitSerializer


class HabitListCreateView(generics.ListCreateAPIView):

    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(
            user_id=self.request.user.id
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(
            user_id=self.request.user.id
        )


class HabitDetailView(generics.RetrieveUpdateDestroyAPIView):

    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(
            user_id=self.request.user.id
        )
