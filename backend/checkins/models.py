
from django.db import models


class CheckIn(models.Model):
    habit = models.ForeignKey(
        "habits.Habit",
        on_delete=models.CASCADE,
        related_name="checkins"
    )

    completed = models.BooleanField(default=True)

    note = models.TextField(blank=True)

    date = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["habit", "date"],
                name="uniq_checkin_habit_date"
            )
        ]

    def __str__(self):
        return f"{self.habit.title} - {self.date}"
