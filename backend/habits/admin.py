
from django.contrib import admin
from .models import Habit


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'frequency', 'created_at')
    search_fields = ('title', 'description')
    list_filter = ('frequency', 'created_at')
