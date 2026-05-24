import os
from typing import List

from schemas import SecurityEvent, ThreatAssessment
from tools import get_ip_reputation, get_gemini_client
from alerts import send_slack_alert, send_email_alert


SAMPLE_LOGS = [
    "2026-05-24T08:12:01 IP=198.51.100.42 PORT=4444 USER=unknown ACTION=failed_login",
    "2026-05-24T08:12:15 IP=198.51.100.42 PORT=4444 USER=unknown ACTION=failed_login",
    "2026-05-24T08:12:31 IP=198.51.100.42 PORT=4444 USER=unknown ACTION=failed_login",
    "2026-05-24T08:13:02 IP=198.51.100.42 PORT=4444 USER=unknown ACTION=success_login",
    "2026-05-24T09:00:00 IP=10.0.0.5 PORT=22 USER=svc-monitor ACTION=healthcheck",
]


def parse_log_line(line: str) -> SecurityEvent:
    parts = {p.split("=")[0]: p.split("=")[1] for p in line.split() if "=" in p}
    ts = parts.get("2026-05-24T08:12:01")
    return SecurityEvent(timestamp=None, src_ip=parts.get("IP"), src_port=int(parts.get("PORT")) if parts.get("PORT") else None, username=parts.get("USER"), event_type=parts.get("ACTION","unknown"), raw=line)


def simple_score(events: List[SecurityEvent]) -> List[ThreatAssessment]:
    assessments: List[ThreatAssessment] = []
    for e in events:
        score = 0
        if e.src_ip and e.src_ip.startswith("198.51"):
            score += 60
        if e.event_type.startswith("failed"):
            score += 10
        priority = "low"
        if score >= 60:
            priority = "critical"
        elif score >= 30:
            priority = "high"
        assessments.append(ThreatAssessment(event=e, score=score, priority=priority))
    return sorted(assessments, key=lambda a: a.score, reverse=True)


def main():
    events = [parse_log_line(l) for l in SAMPLE_LOGS]
    assessments = simple_score(events)
    for a in assessments:
        print(f"Priority={a.priority} Score={a.score} IP={a.event.src_ip} Event={a.event.event_type}")
        # Enrich with TI
        if a.event.src_ip:
            print("TI:", get_ip_reputation(a.event.src_ip))
        # Send alerts for high/critical
        if a.priority in ("critical", "high"):
            message = f"Security Alert - {a.priority.upper()}\nIP: {a.event.src_ip}\nScore: {a.score}\nEvent: {a.event.event_type}\nRaw: {a.event.raw}"
            ok, info = send_slack_alert(message)
            print("Slack alert:", ok, info)
            ok2, info2 = send_email_alert(
                subject=f"Security Alert: {a.priority.upper()} {a.event.src_ip}",
                body=message,
            )
            print("Email alert:", ok2, info2)


if __name__ == "__main__":
    main()
