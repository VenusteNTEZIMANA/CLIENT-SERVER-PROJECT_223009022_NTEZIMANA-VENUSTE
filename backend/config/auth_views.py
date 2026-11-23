

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status


class SupabaseMeView(APIView):
    """
    Return the currently authenticated Supabase user.

    Requires a valid Supabase JWT access token.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response(
            {
                "success": True,
                "authenticated": True,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "role": user.role,
                    "supabase_role": user.supabase_role,
                    "is_active": user.is_active,
                },
            },
            status=status.HTTP_200_OK,
        )