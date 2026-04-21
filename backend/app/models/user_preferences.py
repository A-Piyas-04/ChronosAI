import uuid
from datetime import UTC, datetime, time

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def utcnow() -> datetime:
    return datetime.now(UTC)


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    work_days: Mapped[list[int]] = mapped_column(JSON, nullable=False)
    work_start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    work_end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    productive_start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    productive_end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    deep_work_session_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=45)
    short_break_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    max_deep_work_sessions_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    default_task_session_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=45)
    allow_weekend_scheduling: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    role_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utcnow,
        onupdate=utcnow,
    )

    user: Mapped["User"] = relationship("User", back_populates="preferences")
