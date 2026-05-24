from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SecurityEvent(BaseModel):
    timestamp: Optional[datetime]
    src_ip: Optional[str]
    src_port: Optional[int]
    username: Optional[str]
    event_type: str
    raw: str


class ThreatAssessment(BaseModel):
    event: SecurityEvent
    score: float = 0.0
    priority: str = "low"
    explanation: Optional[str] = None
    attack_pattern: Optional[str] = None
    remediation: Optional[str] = None
    false_positive: bool = False
    ai_thought: Optional[str] = None

