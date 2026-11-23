
from django.db import IntegrityError, transaction

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CheckIn
from .serializers import CheckInSerializer


class CheckInListCreateView(generics.ListCreateAPIView):
    serializer_class = CheckInSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CheckIn.objects.filter(
            habit__user_id=self.request.user.id
        ).select_related("habit").order_by("-date")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                serializer.save()

        except IntegrityError:
            return Response(
                {
                    "detail": (
                        "You have already checked in "
                        "for this habit on this date."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class CheckInDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CheckInSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CheckIn.objects.filter(
            habit__user_id=self.request.user.id
        )


class LongestStreakView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        checkins = CheckIn.objects.filter(
            habit__user_id=request.user.id,
            completed=True
        ).order_by("habit_id", "date")

        longest_streak = 0
        current_streak = 0
        previous_habit = None
        previous_date = None

        for checkin in checkins:
            if (
                checkin.habit_id == previous_habit
                and previous_date
                and (checkin.date - previous_date).days == 1
            ):
                current_streak += 1
            else:
                current_streak = 1

            longest_streak = max(
                longest_streak,
                current_streak
            )

            previous_habit = checkin.habit_id
            previous_date = checkin.date

        return Response({
            "longest_streak": longest_streak
        })