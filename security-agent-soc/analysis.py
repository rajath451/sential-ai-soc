import re
import os
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from schemas import SecurityEvent, ThreatAssessment
from tools import get_gemini_client, get_ip_reputation
from google.genai import types

# Pydantic schemas for Gemini Structured Output
class SecurityEventModel(BaseModel):
    timestamp: Optional[str] = Field(None, description="ISO 8601 Timestamp of the event if found in raw log, else null")
    src_ip: Optional[str] = Field(None, description="Source IP address if found, else null")
    src_port: Optional[int] = Field(None, description="Source port if found, else null")
    username: Optional[str] = Field(None, description="Username associated with event if found, else null")
    event_type: str = Field(..., description="Normalized short category/action, e.g. SQL Injection, Brute Force, Unauthorized Access, SSH Login, Info Event")
    raw: str = Field(..., description="The exact original raw log line")

class ThreatAssessmentModel(BaseModel):
    event: SecurityEventModel
    score: float = Field(..., description="Threat score from 0 (harmless false positive/healthcheck) to 100 (critical live breach)")
    priority: str = Field(..., description="Threat priority: low, medium, high, critical")
    explanation: str = Field(..., description="A concise summary of why this score was assigned")
    attack_pattern: Optional[str] = Field(None, description="Details on the specific attack pattern or vectors used (e.g. SQL Union Injection, Credential Stuffing, System Admin Action)")
    remediation: Optional[str] = Field(None, description="Actionable mitigation steps for security teams")
    false_positive: bool = Field(False, description="True if this is a harmless administrative action, standard healthcheck, internal scan, or normal user log")
    ai_thought: Optional[str] = Field(None, description="Step-by-step reasoning the security agent went through to assess this event")

class BatchThreatAssessment(BaseModel):
    assessments: List[ThreatAssessmentModel]

# Standard Regex for heuristic parsing (as fallback)
LOG_REGEX = re.compile(
    r"(?P<ts>\S+)\s+IP=(?P<ip>[^\s]+)\s+PORT=(?P<port>\d+)\s+USER=(?P<user>[^\s]+)\s+ACTION=(?P<action>.+)"
)

ALLOWLIST_PREFIXES = ["10.", "192.168.", "127."]

def parse_log_line(line: str) -> SecurityEvent:
    m = LOG_REGEX.search(line)
    timestamp = None
    if m:
        try:
            timestamp = datetime.fromisoformat(m.group("ts"))
        except ValueError:
            timestamp = None
        return SecurityEvent(
            timestamp=timestamp,
            src_ip=m.group("ip"),
            src_port=int(m.group("port")),
            username=m.group("user"),
            event_type=m.group("action").strip(),
            raw=line.strip(),
        )

    # Secondary loose parsing for raw logs of different formats
    ip_match = re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", line)
    user_match = re.search(r"user[=:]?\s*(\w+)|as\s+(\w+)|user\s+(\S+)", line, re.IGNORECASE)
    port_match = re.search(r"port[=:]?\s*(\d+)", line, re.IGNORECASE)
    
    src_ip = ip_match.group(0) if ip_match else None
    username = user_match.group(1) or user_match.group(2) or user_match.group(3) if user_match else None
    src_port = int(port_match.group(1)) if port_match else None
    
    # Try to extract a timestamp
    ts_match = re.search(r"(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})", line)
    if ts_match:
        try:
            timestamp = datetime.fromisoformat(ts_match.group(0).replace(" ", "T"))
        except ValueError:
            timestamp = None

    # Detect action/event-type from line keywords
    event_type = "unknown"
    lower_line = line.lower()
    if "sql" in lower_line or "union select" in lower_line:
        event_type = "SQL Injection attempt"
    elif "failed login" in lower_line or "failed connection" in lower_line:
        event_type = "Failed login"
    elif "xss" in lower_line or "<script>" in lower_line:
        event_type = "XSS attempt"
    elif "unauthorized" in lower_line:
        event_type = "Unauthorized access attempt"
    elif "rate limit" in lower_line:
        event_type = "Rate limit exceeded"
    elif "healthcheck" in lower_line or "cron" in lower_line:
        event_type = "Routine system operation"

    return SecurityEvent(
        timestamp=timestamp,
        src_ip=src_ip,
        src_port=src_port,
        username=username,
        event_type=event_type,
        raw=line.strip(),
    )


def score_event(event: SecurityEvent) -> ThreatAssessment:
    """Heuristic threat scoring (used as baseline/fallback)."""
    score = 0.0
    reasons: List[str] = []
    false_positive = False
    attack_pattern = "Heuristic rule classification"
    remediation = "Investigate the connection and apply standard firewall blocks if malicious."

    # Heuristic rules
    if event.src_ip and event.src_ip.startswith("198.51"):
        score += 60
        reasons.append("suspicious known IP range")

    if "failed" in event.event_type.lower() or "fail" in event.event_type.lower():
        score += 15
        reasons.append("failed authentication attempt")
        attack_pattern = "Brute Force Attack / Credential Stuffing"
        remediation = "Enforce rate limiting and verify account lockout rules."

    if "success" in event.event_type.lower():
        score += 5
        reasons.append("successful authentication")

    if "sql" in event.event_type.lower() or "union" in event.event_type.lower():
        score += 85
        reasons.append("SQL Injection signature matched")
        attack_pattern = "SQL Injection (SQLi)"
        remediation = "Audit database input sanitation and parameterize active SQL queries."

    if "xss" in event.event_type.lower() or "script" in event.event_type.lower():
        score += 80
        reasons.append("XSS script tag signature matched")
        attack_pattern = "Cross-Site Scripting (XSS)"
        remediation = "Sanitize HTML inputs, encode templates, and define a strong Content Security Policy (CSP)."

    if "unauthorized" in event.event_type.lower() or "denied" in event.event_type.lower():
        score += 30
        reasons.append("unauthorized API/web access attempt")
        attack_pattern = "Unauthorized Resource Access"
        remediation = "Verify authentication tokens and audit user ACL controls."

    if event.src_port in {22, 3389, 4444}:
        score += {22: 5, 3389: 8, 4444: 12}[event.src_port]
        reasons.append(f"suspicious port connection {event.src_port}")

    # Check IP Reputation tool
    if event.src_ip:
        ti_report = get_ip_reputation(event.src_ip)
        if "CRITICAL" in ti_report:
            score += 30
            reasons.append("threat intel confirmed malicious IP")
            remediation = "Isolate host immediately and block IP on network firewalls."

    # False positive filtering
    if event.src_ip and any(event.src_ip.startswith(prefix) for prefix in ALLOWLIST_PREFIXES):
        score = max(0.0, score - 30)
        reasons.append("allowlisted internal IP")
        false_positive = True
        remediation = "No action required. Internal authorized traffic."

    if "routine" in event.event_type.lower() or "healthcheck" in event.event_type.lower():
        score = 0.0
        reasons.append("authorized routine monitoring")
        false_positive = True
        remediation = "No action required. Routine automated service check."

    # Clamp score
    score = min(max(score, 0.0), 100.0)

    priority = "low"
    if score >= 80:
        priority = "critical"
    elif score >= 60:
        priority = "high"
    elif score >= 30:
        priority = "medium"

    if not reasons:
        reasons.append("no strong threat indicators found")

    return ThreatAssessment(
        event=event,
        score=score,
        priority=priority,
        explanation="; ".join(reasons),
        attack_pattern=attack_pattern,
        remediation=remediation,
        false_positive=false_positive,
        ai_thought="Parsed via local heuristic scanning engine."
    )


def assess_log_text(log_text: str) -> List[ThreatAssessment]:
    lines = [line.strip() for line in log_text.splitlines() if line.strip()]
    if not lines:
        return []

    client = get_gemini_client()
    if client:
        try:
            # Format logs list as a clean text representation
            formatted_logs = "\n".join(f"Log [{idx+1}]: {line}" for idx, line in enumerate(lines))
            
            prompt = f"""
            You are a senior Autonomous Security Operations Center (SOC) Analyst.
            Analyze the following list of raw security log lines.
            
            Identify actual security threats vs false positives.
            For each log, populate:
            1. event (parse the timestamp, source IP, source port, username, and event type/action)
            2. score (0 for safe/false-positives/healthchecks, up to 100 for verified, severe live breaches)
            3. priority (low, medium, high, critical)
            4. explanation (simple explanation of what this log shows)
            5. attack_pattern (e.g. Brute Force, SQL Injection, Routine Administration, etc.)
            6. remediation (what steps the security team must take)
            7. false_positive (true if it's benign/administrative/internal/harmless, false if it's a real suspicious/malicious threat)
            8. ai_thought (your internal step-by-step security reasoning)

            **BENIGN / FALSE POSITIVE CRITERIA:**
            - Internal IP addresses starting with '10.', '192.168.', or '127.' are usually trusted internal networks. Unless they exhibit extreme malicious signatures, rate them very low threat.
            - Routine jobs like 'backup_daily', 'healthcheck', 'svc-monitor' are benign administrative tasks. Assign them score=0, priority=low, false_positive=true.
            
            **MALICIOUS CRITERIA:**
            - Multiple failed logins in short succession.
            - SQL Injection patterns (e.g. UNION SELECT, SLEEP, etc.).
            - XSS injection script tags.
            - External unknown IPs targeting sensitive ports (22, 3389, 4444).
            
            Here are the raw logs to analyze:
            {formatted_logs}
            """

            # Call Gemini
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=BatchThreatAssessment,
                    temperature=0.1
                )
            )

            # Parse Gemini's structured response
            batch_result = BatchThreatAssessment.model_validate_json(response.text)
            
            assessments: List[ThreatAssessment] = []
            for item in batch_result.assessments:
                # Convert string timestamp back to datetime
                dt = None
                if item.event.timestamp:
                    try:
                        dt = datetime.fromisoformat(item.event.timestamp.replace("Z", "+00:00"))
                    except Exception:
                        dt = None

                event_obj = SecurityEvent(
                    timestamp=dt,
                    src_ip=item.event.src_ip,
                    src_port=item.event.src_port,
                    username=item.event.username,
                    event_type=item.event.event_type,
                    raw=item.event.raw
                )
                
                # Dynamic Tool Enrichment inside assessment loop
                score = item.score
                priority = item.priority
                explanation = item.explanation
                remediation = item.remediation
                
                if item.event.src_ip:
                    # Run threat intel
                    ti_report = get_ip_reputation(item.event.src_ip)
                    if "CRITICAL" in ti_report:
                        score = max(95.0, score)
                        priority = "critical"
                        explanation = f"THREAT INTEL TRIGGERED: {ti_report} | {explanation}"
                        remediation = f"CRITICAL MITIGATION REQUIRED: {remediation or ''} Isolate host from the network immediately."

                # Enforce exact low/medium/high/critical string compatibility
                priority = priority.lower()
                if priority not in ("low", "medium", "high", "critical"):
                    priority = "low"

                assessments.append(ThreatAssessment(
                    event=event_obj,
                    score=score,
                    priority=priority,
                    explanation=explanation,
                    attack_pattern=item.attack_pattern,
                    remediation=remediation,
                    false_positive=item.false_positive,
                    ai_thought=item.ai_thought
                ))

            # Return sorted assessments by score descending
            return sorted(assessments, key=lambda a: a.score, reverse=True)

        except Exception as e:
            # Log error and fall back to local heuristic analysis
            print(f"Error in Gemini assessment: {e}. Falling back to heuristics.")

    # Fallback to standard heuristics
    assessments = [score_event(parse_log_line(line)) for line in lines]
    return sorted(assessments, key=lambda a: a.score, reverse=True)


def serialize_assessments(assessments: List[ThreatAssessment]) -> List[Dict[str, Any]]:
    return [
        {
            "score": a.score,
            "priority": a.priority,
            "explanation": a.explanation,
            "attack_pattern": a.attack_pattern,
            "remediation": a.remediation,
            "false_positive": a.false_positive,
            "ai_thought": a.ai_thought,
            "event": {
                "timestamp": a.event.timestamp.isoformat() if a.event.timestamp else None,
                "src_ip": a.event.src_ip,
                "src_port": a.event.src_port,
                "username": a.event.username,
                "event_type": a.event.event_type,
                "raw": a.event.raw,
            },
        }
        for a in assessments
    ]
