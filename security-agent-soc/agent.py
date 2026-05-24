import os
import sys

# Reconfigure Windows console to handle UTF-8 print statements gracefully
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from datetime import datetime
from typing import List
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from schemas import SecurityEvent, ThreatAssessment
from tools import get_gemini_client, get_ip_reputation
from analysis import assess_log_text

def run_autonomous_agent(log_filepath: str = "logs.txt"):
    """
    Autonomous Security Agent. Reads log files, analyzes threats,
    filters false positives, queries Threat Intelligence, and writes
    a complete Plain-English Security Assessment Report.
    """
    print("🛡️ Sentinel Autonomous Security Agent starting...")
    
    # Read the log file
    if not os.path.exists(log_filepath):
        print(f"⚠️ Log file not found at {log_filepath}. Writing mock log dataset for analysis...")
        mock_logs = (
            "2026-05-24T08:12:01 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login\n"
            "2026-05-24T08:12:05 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login\n"
            "2026-05-24T08:12:10 IP=198.51.100.42 PORT=4444 USER=admin ACTION=failed_login\n"
            "2026-05-24T08:12:15 IP=198.51.100.42 PORT=4444 USER=admin ACTION=success_login\n"
            "2026-05-24T14:02:40 IP=10.0.0.50 PORT=80 USER=svc-monitor ACTION=routine_healthcheck\n"
            "2026-05-24T14:05:12 IP=45.12.88.192 PORT=80 USER=guest ACTION=union_select_sql_injection\n"
            "2026-05-24T14:10:00 IP=192.168.1.5 PORT=22 USER=sysadmin ACTION=success_login\n"
        )
        with open(log_filepath, "w") as f:
            f.write(mock_logs)
        print(f"✅ Mock log dataset written to {log_filepath}")

    with open(log_filepath, "r") as f:
        log_text = f.read()

    print(f"📝 Reading {len(log_text.splitlines())} logs from {log_filepath}...")
    print("🧠 Initiating AI Threat Monitoring Agent analysis...")

    assessments = assess_log_text(log_text)

    # Let's count totals
    critical_threats = [a for a in assessments if a.priority == "critical"]
    high_threats = [a for a in assessments if a.priority == "high"]
    medium_threats = [a for a in assessments if a.priority == "medium"]
    low_threats = [a for a in assessments if a.priority == "low"]
    false_positives = [a for a in assessments if a.false_positive]

    print("\n🏁 Threat Analysis Complete!")
    print(f"📊 SUMMARY: {len(assessments)} logs parsed.")
    print(f"   - CRITICAL: {len(critical_threats)}")
    print(f"   - HIGH:     {len(high_threats)}")
    print(f"   - MEDIUM:   {len(medium_threats)}")
    print(f"   - LOW:      {len(low_threats)}")
    print(f"   - Benign/FP: {len(false_positives)}")

    # Let's compile a beautiful markdown report!
    report_lines = [
        "# Sentinel AI Security Agent Report",
        f"**Generated At**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"**Target Log File**: `{log_filepath}`",
        "",
        "## Executive Summary",
        f"The Sentinel AI Agent analyzed {len(assessments)} log events and identified **{len(critical_threats) + len(high_threats)}** high-severity security incidents. "
        f"**{len(false_positives)}** events were successfully filtered out as benign administrative actions or false positives.",
        "",
        "## Threat Assessment Matrix",
        "| Score | Priority | Source IP | Username | Event Type | Attack Pattern | Remediation Action |",
        "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
    ]

    for a in assessments:
        ip = a.event.src_ip or "N/A"
        user = a.event.username or "N/A"
        fp_badge = " 🟢 [Benign]" if a.false_positive else ""
        report_lines.append(
            f"| **{a.score}/100** | `{a.priority.upper()}`{fp_badge} | `{ip}` | `{user}` | {a.event.event_type} | {a.attack_pattern or 'N/A'} | {a.remediation or 'N/A'} |"
        )

    report_lines.extend([
        "",
        "## Deep Threat Intel & Attack Explanations",
    ])

    for i, a in enumerate(assessments):
        if a.priority in ("critical", "high") or not a.false_positive:
            report_lines.extend([
                f"### Incident #{i+1}: {a.event.event_type} (Score: {a.score})",
                f"- **Priority**: `{a.priority.upper()}`",
                f"- **Source Entity**: `IP: {a.event.src_ip} | Port: {a.event.src_port} | User: {a.event.username}`",
                f"- **Attack Vector**: `{a.attack_pattern or 'Unclassified'}`",
                f"- **AI SOC Reasoning**: *{a.ai_thought or 'Parsed via standard heuristics.'}*",
                f"- **Plain-English Analysis**: {a.explanation}",
                f"- **Actionable Remediation**: **{a.remediation}**",
                ""
            ])

    report_path = "agent_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"\n✨ Premium Markdown Incident Report generated successfully at: {os.path.abspath(report_path)}")
    print("📜 Open agent_report.md to review the detailed threat intelligence insights.")

if __name__ == "__main__":
    filepath = "logs.txt"
    if len(sys.argv) > 1:
        filepath = sys.argv[1]
    run_autonomous_agent(filepath)