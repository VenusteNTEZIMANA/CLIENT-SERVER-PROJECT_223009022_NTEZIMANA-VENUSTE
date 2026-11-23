
import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from getpass import getpass
from pathlib import Path
import os

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

BASE_API = "http://127.0.0.1:8000"


def api_request(method, url, token, data=None):
    body = None if data is None else json.dumps(data).encode()

    req = Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method=method,
    )

    try:
        with urlopen(req, timeout=20) as response:
            result = response.read()
            return response.status, (
                json.loads(result) if result else None
            )
    except HTTPError as error:
        result = error.read()
        try:
            return error.code, json.loads(result)
        except ValueError:
            return error.code, result.decode()


def main():
    email = input("Supabase email: ").strip()
    password = getpass("Password: ")

    auth = Request(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        data=json.dumps({
            "email": email,
            "password": password,
        }).encode(),
        headers={
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(auth, timeout=20) as response:
            login = json.loads(response.read())
    except HTTPError as error:
        print("LOGIN FAILED:", error.code)
        print(error.read().decode())
        return

    token = login["access_token"]
    print("\nLOGIN SUCCESS")

    # Get existing habits
    status, habits = api_request(
        "GET", f"{BASE_API}/api/habits/", token
    )

    print("\nHABITS:", status, habits)

    if not isinstance(habits, list) or not habits:
        print("Create a habit first.")
        return

    habit_id = habits[0]["id"]

    # Create check-in
    status, created = api_request(
        "POST",
        f"{BASE_API}/api/checkins/",
        token,
        {
            "habit": habit_id,
            "completed": True,
            "note": "First test check-in",
            "date": "2026-11-20",
        },
    )

    print("\nCREATE:", status, created)

    if status != 201:
        print("Check-in creation failed.")
        return

    checkin_id = created["id"]

    # List check-ins
    status, result = api_request(
        "GET", f"{BASE_API}/api/checkins/", token
    )
    print("\nLIST:", status, result)

    # Update check-in
    status, result = api_request(
        "PATCH",
        f"{BASE_API}/api/checkins/{checkin_id}/",
        token,
        {"note": "Updated test check-in"},
    )
    print("\nUPDATE:", status, result)

    # Delete check-in
    status, result = api_request(
        "DELETE",
        f"{BASE_API}/api/checkins/{checkin_id}/",
        token,
    )
    print("\nDELETE:", status, result)

    print("\nCHECK-IN API TEST COMPLETED")


if __name__ == "__main__":
    main()