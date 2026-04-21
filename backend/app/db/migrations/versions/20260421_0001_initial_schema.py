"""initial_schema

Revision ID: 20260421_0001
Revises:
Create Date: 2026-04-21 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260421_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("hashed_password", sa.String(length=255), nullable=True),
        sa.Column("auth_provider", sa.String(length=20), nullable=False),
        sa.Column("google_account_email", sa.String(length=255), nullable=True),
        sa.Column("profile_image_url", sa.Text(), nullable=True),
        sa.Column("timezone", sa.String(length=100), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)

    op.create_table(
        "connected_calendars",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(length=20), nullable=False),
        sa.Column("provider_account_id", sa.String(length=255), nullable=True),
        sa.Column("calendar_id", sa.String(length=255), nullable=False),
        sa.Column("calendar_name", sa.String(length=255), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=True),
        sa.Column("refresh_token", sa.Text(), nullable=True),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_primary", sa.Boolean(), nullable=False),
        sa.Column("sync_enabled", sa.Boolean(), nullable=False),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "schedules",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("week_start_date", sa.Date(), nullable=False),
        sa.Column("week_end_date", sa.Date(), nullable=False),
        sa.Column("generation_type", sa.String(length=30), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("based_on_task_count", sa.Integer(), nullable=True),
        sa.Column("based_on_event_count", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_schedules_user_id_week_start_date", "schedules", ["user_id", "week_start_date"], unique=False)
    op.create_index("ix_schedules_user_id_status", "schedules", ["user_id", "status"], unique=False)

    op.create_table(
        "tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("estimated_minutes", sa.Integer(), nullable=False),
        sa.Column("deadline_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("task_type", sa.String(length=20), nullable=False),
        sa.Column("classification_source", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("is_flexible", sa.Boolean(), nullable=False),
        sa.Column("preferred_time_of_day", sa.String(length=20), nullable=True),
        sa.Column("earliest_start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("estimated_minutes > 0", name="ck_tasks_estimated_minutes_positive"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_tasks_user_id_status", "tasks", ["user_id", "status"], unique=False)
    op.create_index("ix_tasks_user_id_deadline_at", "tasks", ["user_id", "deadline_at"], unique=False)
    op.create_index("ix_tasks_user_id_priority", "tasks", ["user_id", "priority"], unique=False)

    op.create_table(
        "user_preferences",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("work_days", sa.JSON(), nullable=False),
        sa.Column("work_start_time", sa.Time(), nullable=True),
        sa.Column("work_end_time", sa.Time(), nullable=True),
        sa.Column("productive_start_time", sa.Time(), nullable=True),
        sa.Column("productive_end_time", sa.Time(), nullable=True),
        sa.Column("deep_work_session_minutes", sa.Integer(), nullable=False),
        sa.Column("short_break_minutes", sa.Integer(), nullable=False),
        sa.Column("max_deep_work_sessions_per_day", sa.Integer(), nullable=True),
        sa.Column("default_task_session_minutes", sa.Integer(), nullable=False),
        sa.Column("allow_weekend_scheduling", sa.Boolean(), nullable=False),
        sa.Column("role_type", sa.String(length=20), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )

    op.create_table(
        "calendar_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("connected_calendar_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("external_event_id", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location", sa.String(length=500), nullable=True),
        sa.Column("start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("is_all_day", sa.Boolean(), nullable=False),
        sa.Column("is_recurring", sa.Boolean(), nullable=False),
        sa.Column("recurrence_rule", sa.Text(), nullable=True),
        sa.Column("is_busy", sa.Boolean(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["connected_calendar_id"], ["connected_calendars.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("connected_calendar_id", "external_event_id"),
    )
    op.create_index("ix_calendar_events_user_id_start_at", "calendar_events", ["user_id", "start_at"], unique=False)

    op.create_table(
        "schedule_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("schedule_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("task_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("session_type", sa.String(length=20), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("planned_start_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("planned_end_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("planned_duration_minutes", sa.Integer(), nullable=False),
        sa.Column("actual_start_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_end_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_duration_minutes", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("source", sa.String(length=20), nullable=False),
        sa.Column("position_index", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["schedule_id"], ["schedules.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["task_id"], ["tasks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_schedule_sessions_schedule_id", "schedule_sessions", ["schedule_id"], unique=False)
    op.create_index(
        "ix_schedule_sessions_user_id_planned_start_at",
        "schedule_sessions",
        ["user_id", "planned_start_at"],
        unique=False,
    )
    op.create_index("ix_schedule_sessions_user_id_status", "schedule_sessions", ["user_id", "status"], unique=False)
    op.create_index("ix_schedule_sessions_task_id", "schedule_sessions", ["task_id"], unique=False)

    op.create_table(
        "session_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(length=30), nullable=False),
        sa.Column("reason_code", sa.String(length=100), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("logged_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["schedule_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_session_logs_session_id_logged_at", "session_logs", ["session_id", "logged_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_session_logs_session_id_logged_at", table_name="session_logs")
    op.drop_table("session_logs")

    op.drop_index("ix_schedule_sessions_task_id", table_name="schedule_sessions")
    op.drop_index("ix_schedule_sessions_user_id_status", table_name="schedule_sessions")
    op.drop_index("ix_schedule_sessions_user_id_planned_start_at", table_name="schedule_sessions")
    op.drop_index("ix_schedule_sessions_schedule_id", table_name="schedule_sessions")
    op.drop_table("schedule_sessions")

    op.drop_index("ix_calendar_events_user_id_start_at", table_name="calendar_events")
    op.drop_table("calendar_events")

    op.drop_table("user_preferences")

    op.drop_index("ix_tasks_user_id_priority", table_name="tasks")
    op.drop_index("ix_tasks_user_id_deadline_at", table_name="tasks")
    op.drop_index("ix_tasks_user_id_status", table_name="tasks")
    op.drop_table("tasks")

    op.drop_index("ix_schedules_user_id_status", table_name="schedules")
    op.drop_index("ix_schedules_user_id_week_start_date", table_name="schedules")
    op.drop_table("schedules")

    op.drop_table("connected_calendars")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
