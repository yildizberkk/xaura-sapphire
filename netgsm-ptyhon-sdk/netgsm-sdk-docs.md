# Netgsm Python SDK — Reference Documentation

**Package:** `netgsm-sms` v1.1.2  
**PyPI:** https://pypi.org/project/netgsm-sms/  
**GitHub:** https://github.com/netgsm/netgsm-sms-python  
**License:** MIT | **Requires:** Python ≥ 3.6  

---

## Installation

```bash
pip install netgsm-sms
```

---

## Authentication / Initialization

```python
from netgsm import Netgsm

netgsm = Netgsm(
    username="YOUR_USERNAME",   # Netgsm account username
    password="YOUR_PASSWORD",   # Netgsm account password
    appname="YOUR_APP_NAME"     # Optional — application name tag
)
```

**Environment variables** (recommended, matches the SDK's own `.env.example`):

```
NETGSM_USERNAME=YOUR_USERNAME
NETGSM_PASSWORD=YOUR_PASSWORD
NETGSM_MSGHEADER=YOUR_SMS_HEADER
NETGSM_APPNAME=YOUR_APP_NAME
```

---

## SMS Service (`netgsm.sms`)

### Send a single SMS

```python
response = netgsm.sms.send(
    msgheader="HEADER",          # Sender name registered in Netgsm panel
    messages=[
        {"msg": "Hello world!", "no": "5XXXXXXXXX"}
    ]
)
# response contains a 'jobid' key on success
print(response.get("jobid"))
```

### Send bulk SMS (multiple recipients / multiple messages)

```python
response = netgsm.sms.send(
    msgheader="HEADER",
    messages=[
        {"msg": "Hello world!", "no": "5XXXXXXXXX"},
        {"msg": "Hello Türkiye!", "no": "5YYYYYYYYY"}
    ]
)
```

### Send scheduled SMS

```python
response = netgsm.sms.send(
    msgheader="HEADER",
    messages=[
        {"msg": "Reminder message", "no": "5XXXXXXXXX"}
    ],
    startdate="ddMMyyyyHHmm"  # e.g. "010120261200" = Jan 1 2026 12:00
)
```

### Cancel a scheduled SMS

```python
response = netgsm.sms.cancel(jobid="12345678")
```

### Get SMS report

```python
# By job ID(s)
response = netgsm.sms.get_report(jobids=["12345678"])

# By date range
response = netgsm.sms.get_report(
    startdate="01.01.2026 00:00:00",
    stopdate="31.01.2026 23:59:59"
)
```

### List SMS headers (sender names)

```python
response = netgsm.sms.get_headers()
```

---

## Error Handling

All errors inherit from `ApiException`. Import what you need:

```python
from netgsm.exceptions import (
    ApiException,           # Base — catch-all
    HttpException,          # Base for HTTP errors
    BadRequestException,    # HTTP 400
    UnauthorizedException,  # HTTP 401
    ForbiddenException,     # HTTP 403
    NotFoundException,      # HTTP 404
    NotAcceptableException, # HTTP 406 — Netgsm business errors land here
    ServerException,        # HTTP 5xx
    TimeoutException,       # Request timeout
    ConnectionException     # Network/connection error
)
```

> **Important:** Netgsm API business errors always return **HTTP 406** and are raised as `NotAcceptableException`. Check `e.code` for the specific business error.

### Full error handling pattern

```python
from netgsm.exceptions import (
    ApiException, NotAcceptableException,
    TimeoutException, ConnectionException
)

try:
    response = netgsm.sms.send(
        msgheader="HEADER",
        messages=[{"msg": "Test message", "no": "5XXXXXXXXX"}]
    )
    print(f"SMS sent. JobID: {response.get('jobid')}")

except NotAcceptableException as e:
    # Netgsm business error — inspect e.code
    print(f"Netgsm error: {e.message}")
    print(f"HTTP status: {e.http_status}")
    print(f"Error code: {e.code}")

    if e.code == "40":
        print("Message header not defined in Netgsm panel!")
    elif e.code == "30":
        print("Invalid credentials or no API access!")
    elif e.code == "20":
        print("Message text too long or invalid!")
    elif e.code == "80":
        print("Sending limit exceeded!")

except TimeoutException as e:
    print(f"Timeout: {e.message}")

except ConnectionException as e:
    print(f"Connection error: {e.message}")

except ApiException as e:
    print(f"General API error: {e.message}")
```

### HTTP 406 Error Code Reference

| Code | Description |
|------|-------------|
| 20 | Message text problem or exceeds max character limit |
| 30 | Invalid username/password or no API access; or request from unauthorized IP |
| 40 | Message header (sender name) not defined in system |
| 50 | IYS-controlled sending not allowed on this account |
| 51 | No IYS Brand information defined for this subscription |
| 60 | Specified JobID not found |
| 70 | Invalid query — parameter missing or incorrect |
| 80 | Sending limit exceeded |
| 85 | Duplicate sending limit exceeded (>20 tasks for same number within 1 minute) |

Unrecognized codes are reported as "Undefined error code".

---

## Key Notes

- **`msgheader`** must be a sender name already registered and approved in the Netgsm control panel.
- **Phone number format:** Turkish mobile numbers without country code, e.g. `"5XXXXXXXXX"`.
- **`jobid`** returned on successful send — store it if you need to cancel or report later.
- **Scheduled date format:** `ddMMyyyyHHmm` (e.g. `"240420261000"` = April 24 2026 at 10:00).
- The SDK is stateless — one `Netgsm()` instance can be reused for all operations.
