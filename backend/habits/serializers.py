

from rest_framework import serializers

from .models import Habit


class HabitSerializer(serializers.ModelSerializer):

    class Meta:
        model = Habit

        fields = [
            "id",
            "user_id",
            "title",
            "description",
            "frequency",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user_id",
            "created_at",
            "updated_at",
        ]

    def validate_title(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Habit title cannot be empty."
            )

        return value
