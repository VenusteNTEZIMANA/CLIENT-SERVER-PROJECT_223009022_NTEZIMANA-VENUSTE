
from django.conf import settings
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/health"

request = Request(
    url,
    headers={
        "apikey": settings.SUPABASE_PUBLISHABLE_KEY
    }
)

try:
    with urlopen(request, timeout=15) as response:
        print("SUPABASE STATUS:", response.status)
        print("RESPONSE:", response.read().decode())

except HTTPError as error:
    print("HTTP ERROR:", error.code)
    print(error.read().decode())

except URLError as error:
    print("CONNECTION ERROR:", error.reason)