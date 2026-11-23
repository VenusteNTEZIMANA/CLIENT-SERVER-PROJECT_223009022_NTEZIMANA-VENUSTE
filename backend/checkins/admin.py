
from django.contrib import admin
from .models import CheckIn


@admin.register(CheckIn)
class CheckInAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'habit',
        'date',
        'completed',
        'created_at',
    )

    list_filter = (
        'date',
        'completed',
    )

    search_fields = (
        'habit__title',
        'note',
    )

    ordering = ('-date',)
