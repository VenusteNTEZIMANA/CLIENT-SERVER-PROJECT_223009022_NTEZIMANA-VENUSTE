
from rest_framework import serializers

from .models import CheckIn


class CheckInSerializer(serializers.ModelSerializer):

    class Meta:
        model = CheckIn

        fields = [
            "id",
            "habit",
            "completed",
            "note",
            "date",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]

    def validate_habit(self, value):
        request = self.context.get("request")

        if request and request.user.is_authenticated:
            if str(value.user_id) != str(request.user.id):
                raise serializers.ValidationError(
                    "You cannot check in for another user's habit."
                )

        return value

    def validate(self, attrs):
        if self.instance and "date" in attrs:
            if attrs["date"] != self.instance.date:
                raise serializers.ValidationError({
                    "date": "Check-in date cannot be changed."
                })

        habit = attrs.get(
            "habit",
            getattr(self.instance, "habit", None)
        )

        check_date = attrs.get(
            "date",
            getattr(self.instance, "date", None)
        )

        if habit and check_date:
            existing = CheckIn.objects.filter(
                habit=habit,
                date=check_date
            )

            if self.instance:
                existing = existing.exclude(
                    pk=self.instance.pk
                )

            if existing.exists():
                raise serializers.ValidationError({
                    "date": "You have already checked in for this habit on this date."
                })

        return attrs