import os
import smtplib
from email.message import EmailMessage

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import requests
import firebase_admin
from firebase_admin import credentials, messaging

# Initialize Firebase Admin SDK using saved credentials
firebase_initialized = False
try:
    cred_path = os.path.join(os.path.dirname(__file__), "firebase_credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
except Exception as e:
    print(f"Failed to initialize Firebase Admin SDK: {e}")


def send_slack_alert(message: str, webhook_url: str | None = None) -> tuple[bool, str]:
    """Send a simple Slack webhook alert. Returns (ok, info)."""
    webhook = webhook_url or os.getenv("SLACK_WEBHOOK_URL")
    if not webhook:
        return False, "no webhook configured"
    try:
        res = requests.post(webhook, json={"text": message}, timeout=10)
        return (res.status_code in (200, 201, 204), res.text)
    except Exception as e:
        return False, str(e)


def send_email_alert(
    subject: str,
    body: str,
    smtp_host: str | None = None,
    smtp_port: int | None = None,
    username: str | None = None,
    password: str | None = None,
    from_addr: str | None = None,
    to_addrs: list[str] | None = None,
) -> tuple[bool, str]:
    """Send an alert email using SMTP. Returns (ok, info)."""
    host = smtp_host or os.getenv("SMTP_HOST")
    port = int(smtp_port or os.getenv("SMTP_PORT") or 587)
    user = username or os.getenv("SMTP_USER")
    pwd = password or os.getenv("SMTP_PASS")
    sender = from_addr or os.getenv("ALERT_FROM")
    tos = to_addrs or [s.strip() for s in (os.getenv("ALERT_TO") or "").split(",") if s.strip()]

    if not host or not sender or not tos:
        return False, "SMTP not configured (SMTP_HOST/ALERT_FROM/ALERT_TO)"

    msg = EmailMessage()
    msg["From"] = sender
    msg["To"] = ", ".join(tos)
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        if port == 465:
            s = smtplib.SMTP_SSL(host, port, timeout=10)
        else:
            s = smtplib.SMTP(host, port, timeout=10)
            s.starttls()
        if user and pwd:
            s.login(user, pwd)
        s.send_message(msg)
        s.quit()
        return True, "sent"
    except Exception as e:
        return False, str(e)


def send_firebase_alert(title: str, body: str, token: str | None = None) -> tuple[bool, str]:
    """Send a Firebase Cloud Messaging push alert. Returns (ok, info)."""
    if not firebase_initialized:
        return False, "Firebase SDK not initialized (missing firebase_credentials.json)"
    
    try:
        if token:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                token=token,
            )
            response = messaging.send(message)
            return True, f"sent_token: {response}"
        else:
            # Fallback to broadcasting to 'alerts' topic for active dashboard sessions
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                topic="alerts",
            )
            response = messaging.send(message)
            return True, f"sent_topic: {response}"
    except Exception as e:
        return False, str(e)
