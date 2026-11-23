
from django.db import models


class Habit(models.Model):
    id = models.BigAutoField(primary_key=True)

    # UUID of the authenticated Supabase user.
    # This value must be assigned by the server.
    user_id = models.UUIDField(db_index=True)

    title = models.CharField(max_length=200)

    description = models.TextField(blank=True)

    frequency = models.CharField(
        max_length=50,
        default="daily"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
