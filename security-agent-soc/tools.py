import os
from typing import Optional
from google import genai

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Simple wrapper for threat intel and LLM calls. Replace stubs with real integrations.


def get_ip_reputation(ip_address: str) -> str:
    malicious_registry = ["198.51.100.42", "203.0.113.111"]
    if ip_address in malicious_registry:
        return f"CRITICAL: {ip_address} is a known compromised vector."
    return f"IP {ip_address} appears clean."


def get_gemini_client() -> Optional[genai.Client]:
    try:
        if os.getenv("GEMINI_API_KEY"):
            return genai.Client()
    except Exception:
        return None
    return None
