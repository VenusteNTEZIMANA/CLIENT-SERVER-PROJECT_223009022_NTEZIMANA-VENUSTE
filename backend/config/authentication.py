
from functools import lru_cache
from uuid import UUID

import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientConnectionError

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from rest_framework.authentication import (
    BaseAuthentication,
    get_authorization_header,
)
from rest_framework.exceptions import AuthenticationFailed, APIException


class AuthenticationServiceUnavailable(APIException):
    status_code = 503
    default_detail = "Authentication service is temporarily unavailable."
    default_code = "authentication_unavailable"


class SupabaseUser:
    """
    Lightweight authenticated Supabase user.
    No Django User database record is required.
    """

    is_authenticated = True
    is_anonymous = False
    is_active = True
    is_staff = False
    is_superuser = False

    def __init__(self, user_id, email=None):
        self.id = user_id
        self.pk = user_id
        self.email = email
        self.role = "user"
        self.supabase_role = "authenticated"

    def get_username(self):
        return self.email or str(self.id)

    def __str__(self):
        return str(self.id)


@lru_cache(maxsize=1)
def get_supabase_jwks_client():
    supabase_url = getattr(settings, "SUPABASE_URL", "")

    if not supabase_url:
        raise ImproperlyConfigured(
            "SUPABASE_URL is missing from environment settings."
        )

    jwks_url = (
        f"{supabase_url.rstrip('/')}"
        "/auth/v1/.well-known/jwks.json"
    )

    return PyJWKClient(
        jwks_url,
        cache_jwk_set=True,
        lifespan=300,
        timeout=10,
    )


class SupabaseJWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth:
            return None

        if auth[0].lower() != b"bearer":
            return None

        if len(auth) != 2:
            raise AuthenticationFailed(
                "Invalid Authorization header."
            )

        try:
            token = auth[1].decode("utf-8")

            jwks_client = get_supabase_jwks_client()

            signing_key = (
                jwks_client.get_signing_key_from_jwt(token)
            )

            issuer = (
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
            )

            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
                issuer=issuer,
                options={
                    "require": [
                        "exp",
                        "iat",
                        "iss",
                        "aud",
                        "sub",
                        "role",
                    ]
                },
            )

        except PyJWKClientConnectionError as exc:
            raise AuthenticationServiceUnavailable() from exc

        except jwt.PyJWTError as exc:
            raise AuthenticationFailed(
                "Invalid or expired Supabase access token."
            ) from exc

        if claims.get("role") != "authenticated":
            raise AuthenticationFailed(
                "Invalid Supabase user role."
            )

        try:
            user_id = UUID(claims["sub"])
        except (ValueError, TypeError, AttributeError):
            raise AuthenticationFailed(
                "Invalid user identity in access token."
            )

        user = SupabaseUser(
            user_id=user_id,
            email=claims.get("email"),
        )

        return user, claims

    def authenticate_header(self, request):
        return "Bearer"
from functools import lru_cache
from uuid import UUID

import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWKClientConnectionError

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from rest_framework.authentication import (
    BaseAuthentication,
    get_authorization_header,
)
from rest_framework.exceptions import AuthenticationFailed, APIException


class AuthenticationServiceUnavailable(APIException):
    status_code = 503
    default_detail = "Authentication service is temporarily unavailable."
    default_code = "authentication_unavailable"


class SupabaseUser:
    """
    Lightweight authenticated Supabase user.
    No Django User database record is required.
    """

    is_authenticated = True
    is_anonymous = False
    is_active = True
    is_staff = False
    is_superuser = False

    def __init__(self, user_id, email=None):
        self.id = user_id
        self.pk = user_id
        self.email = email
        self.role = "user"
        self.supabase_role = "authenticated"

    def get_username(self):
        return self.email or str(self.id)

    def __str__(self):
        return str(self.id)


@lru_cache(maxsize=1)
def get_supabase_jwks_client():
    supabase_url = getattr(settings, "SUPABASE_URL", "")

    if not supabase_url:
        raise ImproperlyConfigured(
            "SUPABASE_URL is missing from environment settings."
        )

    jwks_url = (
        f"{supabase_url.rstrip('/')}"
        "/auth/v1/.well-known/jwks.json"
    )

    return PyJWKClient(
        jwks_url,
        cache_jwk_set=True,
        lifespan=300,
        timeout=10,
    )


class SupabaseJWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth:
            return None

        if auth[0].lower() != b"bearer":
            return None

        if len(auth) != 2:
            raise AuthenticationFailed(
                "Invalid Authorization header."
            )

        try:
            token = auth[1].decode("utf-8")

            jwks_client = get_supabase_jwks_client()

            signing_key = (
                jwks_client.get_signing_key_from_jwt(token)
            )

            issuer = (
                f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1"
            )

            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256"],
                audience="authenticated",
                issuer=issuer,
                options={
                    "require": [
                        "exp",
                        "iat",
                        "iss",
                        "aud",
                        "sub",
                        "role",
                    ]
                },
            )

        except PyJWKClientConnectionError as exc:
            raise AuthenticationServiceUnavailable() from exc

        except jwt.PyJWTError as exc:
            raise AuthenticationFailed(
                "Invalid or expired Supabase access token."
            ) from exc

        if claims.get("role") != "authenticated":
            raise AuthenticationFailed(
                "Invalid Supabase user role."
            )

        try:
            user_id = UUID(claims["sub"])
        except (ValueError, TypeError, AttributeError):
            raise AuthenticationFailed(
                "Invalid user identity in access token."
            )

        user = SupabaseUser(
            user_id=user_id,
            email=claims.get("email"),
        )

        return user, claims

    def authenticate_header(self, request):
        return "Bearer"