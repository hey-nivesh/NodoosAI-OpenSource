import uuid
from datetime import date, datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import (
    Column, String, Numeric, Integer, Date, DateTime,
    Text, Boolean, ForeignKey, CheckConstraint
)
# pyrefly: ignore [missing-import]
from sqlalchemy.dialects.postgresql import UUID
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    profiles = relationship("Profile", back_populates="organization")
    slack_integration = relationship("SlackIntegration", back_populates="organization", uselist=False)
    notifications = relationship("Notification", back_populates="organization")


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True)  # same as auth.users id
    org_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"))
    full_name = Column(String)
    role = Column(String, nullable=False, default="csm")
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    organization = relationship("Organization", back_populates="profiles")


class SlackIntegration(Base):
    __tablename__ = "slack_integrations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), unique=True)
    team_id = Column(String, nullable=False)
    team_name = Column(String)
    access_token_encrypted = Column(String, nullable=False)
    incoming_webhook_url = Column(String, nullable=False)
    default_channel = Column(String)
    connected_by = Column(String, ForeignKey("profiles.id"))
    connected_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    organization = relationship("Organization", back_populates="slack_integration")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"))
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    body = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    organization = relationship("Organization", back_populates="notifications")


class FactProductUsage(Base):
    __tablename__ = "fact_product_usage"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    account_id = Column(String, nullable=False, index=True)
    account_name = Column(String, nullable=False)
    arr = Column(Numeric(10, 2), nullable=False)
    metric_date = Column(Date, nullable=False, index=True)
    active_users = Column(Integer, default=0)
    api_calls = Column(Integer, default=0)
    feature_execution_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    ticket_id = Column(String, primary_key=True)
    org_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    account_id = Column(String, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="open")


class ChurnRescueAction(Base):
    __tablename__ = "churn_rescue_actions"

    action_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    account_id = Column(String, nullable=False, index=True)
    account_name = Column(String, nullable=False)
    arr = Column(Numeric(10, 2), nullable=False)
    usage_drop_pct = Column(Numeric(5, 2), nullable=False)
    root_cause = Column(String, nullable=True)
    reasoning_summary = Column(Text, nullable=True)
    recommended_playbook = Column(String, nullable=False)
    action_status = Column(String, default="TRIGGERED")
    slack_notification_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class PlaybookRule(Base):
    __tablename__ = "playbook_rules"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    root_cause = Column(String, nullable=False)
    arr_tier_label = Column(String, nullable=False)
    arr_threshold_min = Column(Numeric(12, 2), nullable=False, default=0)
    arr_threshold_max = Column(Numeric(12, 2), nullable=True)
    playbook_name = Column(String, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
