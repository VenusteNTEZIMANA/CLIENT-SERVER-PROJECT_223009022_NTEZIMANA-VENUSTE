
import json
import os
import sys
import getpass

from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from dotenv import load_dotenv


# Load existing backend environment variables
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

DJANGO_API = "http://127.0.0.1:8000/api/auth/me/"


def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ERROR: Supabase URL or publishable key is missing.")
        return

    email = input("Supabase test user email: ").strip()
    password = getpass.getpass("Password (hidden): ")

    # Step 1: Sign in through Supabase Auth
    auth_url = (
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    )

    auth_body = json.dumps({
        "email": email,
        "password": password,
    }).encode("utf-8")

    auth_request = Request(
        auth_url,
        data=auth_body,
        headers={
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(auth_request, timeout=20) as response:
            login_data = json.loads(response.read())
    except HTTPError as error:
        try:
            details = json.loads(error.read())
        except (ValueError, json.JSONDecodeError):
            details = {}

        message = (
            details.get("msg")
            or details.get("message")
            or details.get("error_description")
            or details.get("error")
            or "Sign-in failed."
        )

        print("SUPABASE LOGIN FAILED:", error.code)
        print("DETAIL:", message)
        return

    except URLError as error:
        print("SUPABASE CONNECTION ERROR:", error.reason)
        return

    access_token = login_data.get("access_token")

    if not access_token:
        print("Login response did not contain an access token.")
        return

    print("\nSUPABASE LOGIN: SUCCESS")
    print("Access token received (hidden).")

    # Step 2: Send token to Django
    api_request = Request(
        DJANGO_API,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        },
        method="GET",
    )

    try:
        with urlopen(api_request, timeout=20) as response:
            api_status = response.status
            api_data = json.loads(response.read())

    except HTTPError as error:
        api_status = error.code
        try:
            api_data = json.loads(error.read())
        except ValueError:
            api_data = {"detail": "Django request failed."}

    except URLError as error:
        print("DJANGO CONNECTION ERROR:", error.reason)
        return

    print("\nDJANGO API STATUS:", api_status)
    print("DJANGO API RESPONSE:")
    print(json.dumps(api_data, indent=4))

    # Never print or save the access token.
    access_token = None
    password = None


if __name__ == "__main__":
    main()
