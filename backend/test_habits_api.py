
import json
import os

from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from getpass import getpass

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")

API_URL = "http://127.0.0.1:8000/api/habits/"


def request_api(method, url, token, data=None):
    body = None if data is None else json.dumps(data).encode()

    request = Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method=method,
    )

    try:
        with urlopen(request, timeout=20) as response:
            result = response.read()
            return response.status, (
                json.loads(result) if result else None
            )

    except HTTPError as error:
        result = error.read()
        try:
            response_data = json.loads(result)
        except ValueError:
            response_data = {"detail": "Request failed"}

        return error.code, response_data


def main():
    email = input("Supabase email: ").strip()
    password = getpass("Supabase password: ")

    # 1. Authenticate with Supabase
    auth_request = Request(
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
        with urlopen(auth_request, timeout=20) as response:
            login = json.loads(response.read())

    except HTTPError as error:
        print("LOGIN FAILED:", error.code)
        print(error.read().decode())
        return

    token = login.get("access_token")

    if not token:
        print("No access token received.")
        return

    print("\nLOGIN: SUCCESS")

    # 2. CREATE HABIT
    status, created = request_api(
        "POST",
        API_URL,
        token,
        {
            "title": "Morning Reading",
            "description": "Read for 20 minutes daily",
            "frequency": "daily",
        },
    )

    print("\nCREATE STATUS:", status)
    print("CREATE RESPONSE:", created)

    if status != 201 or not isinstance(created, dict):
        print("CREATE FAILED. Stopping tests.")
        return

    habit_id = created.get("id")

    if not habit_id:
        print("No habit ID returned.")
        return

    detail_url = f"{API_URL}{habit_id}/"

    # 3. LIST HABITS
    status, habits = request_api(
        "GET", API_URL, token
    )

    print("\nLIST STATUS:", status)
    print("LIST RESPONSE:", habits)

    # 4. UPDATE HABIT
    status, updated = request_api(
        "PATCH",
        detail_url,
        token,
        {"title": "Morning Reading Updated"},
    )

    print("\nUPDATE STATUS:", status)
    print("UPDATE RESPONSE:", updated)

    # 5. DELETE HABIT
    status, deleted = request_api(
        "DELETE",
        detail_url,
        token,
    )

    print("\nDELETE STATUS:", status)
    print("DELETE RESPONSE:", deleted)

    print("\nAPI TEST COMPLETED.")

    token = None
    password = None


if __name__ == "__main__":
    main()
