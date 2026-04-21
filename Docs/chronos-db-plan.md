# 🧠 Chronos Database Design (MVP - Separate Tables Model, Full Schema)

---

## 📌 Primary Decision

### **Primary Modeling Approach: Separate Time Tables**

Chronos uses a **relational scheduling model** where fixed commitments and generated work sessions are stored in **separate tables**.

- `calendar_events` stores fixed or synced commitments
- `schedule_sessions` stores generated Chronos work blocks

This replaces the earlier unified `time_blocks` approach and aligns with the finalized architecture choice. The prior version only expanded a subset of entities, which is what this document corrects. 

---

## 🎯 Purpose

This model separates two fundamentally different kinds of time data:

| Data Type | Stored In | Examples |
|---|---|---|
| Fixed Events | `calendar_events` | Classes, meetings, work shifts |
| Work Sessions | `schedule_sessions` | Coding, studying, writing blocks |

This keeps the schema cleaner and easier to reason about.

---

## 🔀 Differentiation Strategy

Instead of one polymorphic time table, Chronos separates time data by lifecycle and purpose:

| Table | Role |
|---|---|
| `calendar_events` | External synced fixed commitments |
| `schedule_sessions` | Internal generated work sessions |

---

## 🚀 Why This Works Better for Chronos

Chronos needs a scheduling engine that is:

- Reliable
- Maintainable
- Easy to debug
- Safe for production
- Expandable for future AI features

Using separate tables enables:

- Clearer domain boundaries
- Easier sync logic for Google Calendar
- Easier execution tracking for user work sessions
- Cleaner validation rules
- Better long-term maintainability

---

## ⚠️ Important Design Rule

### **TimeBlock remains a domain concept, not a persisted table**

Chronos still thinks in terms of “time blocks” at the product and scheduling-engine level, but in the database:

- Fixed commitments live in `calendar_events`
- Generated work chunks live in `schedule_sessions`

This gives you the conceptual benefits of `TimeBlock` without the schema complexity of a single overloaded table.

---

## 🧱 Core Tables (MVP)

| Table Name | Purpose |
|---|---|
| `users` | User identity |
| `user_preferences` | Scheduling preferences |
| `connected_calendars` | Google Calendar connection metadata |
| `calendar_events` | Synced fixed commitments |
| `tasks` | User-defined work items |
| `schedules` | Weekly schedule containers |
| `schedule_sessions` | Scheduled work blocks |
| `session_logs` | Session activity and completion history |

### Optional Near-Term Table

| Table Name | Purpose |
|---|---|
| `weekly_summaries` | Weekly analytics/debrief snapshot |

### Optional Later Table

| Table Name | Purpose |
|---|---|
| `audit_logs` | Operational audit/debug trail |

---

# 1) `users`

## Purpose
Stores the account identity and user-level profile information.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `email` | VARCHAR | No | Unique | Login email |
| `full_name` | VARCHAR | Yes |  | User display name |
| `auth_provider` | VARCHAR / ENUM | No |  | `email` or `google` |
| `google_account_email` | VARCHAR | Yes |  | Linked Google account email if OAuth used |
| `profile_image_url` | TEXT | Yes |  | Avatar URL |
| `timezone` | VARCHAR | No |  | IANA timezone, e.g. `Asia/Dhaka` |
| `is_active` | BOOLEAN | No | Default `true` | Soft account status |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Creation time (UTC) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No |  | Last update time (UTC) |

## Notes
- `email` must be unique
- `timezone` is mandatory for a calendar product

---

# 2) `user_preferences`

## Purpose
Stores scheduling preferences and productivity settings used by the scheduling engine.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `user_id` | UUID | No | FK → `users.id`, unique if 1:1 | Preference owner |
| `work_days` | JSONB / ARRAY | No |  | Active work/study days |
| `work_start_time` | TIME | Yes |  | General day start |
| `work_end_time` | TIME | Yes |  | General day end |
| `productive_start_time` | TIME | Yes |  | Peak productivity start |
| `productive_end_time` | TIME | Yes |  | Peak productivity end |
| `deep_work_session_minutes` | INTEGER | No | > 0 | Preferred deep work session length |
| `short_break_minutes` | INTEGER | No | >= 0 | Preferred short break length |
| `max_deep_work_sessions_per_day` | INTEGER | Yes | >= 0 | Limit of heavy sessions per day |
| `default_task_session_minutes` | INTEGER | No | > 0 | Default session split size |
| `allow_weekend_scheduling` | BOOLEAN | No | Default `false` | Allow scheduling on weekends |
| `role_type` | VARCHAR / ENUM | Yes |  | `student`, `professional`, `mixed` |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No |  | Last update time |

## Notes
- Supports onboarding presets like class routine or office hours
- Can remain 1:1 with user for MVP

---

# 3) `connected_calendars`

## Purpose
Stores metadata for Google Calendar connections and sync state.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `user_id` | UUID | No | FK → `users.id` | Owner |
| `provider` | VARCHAR / ENUM | No |  | Calendar provider, initially `google` |
| `provider_account_id` | VARCHAR | Yes |  | External provider account identifier |
| `calendar_id` | VARCHAR | No |  | Provider calendar ID |
| `calendar_name` | VARCHAR | Yes |  | Friendly calendar name |
| `is_primary` | BOOLEAN | No | Default `false` | Whether this is the primary calendar |
| `sync_enabled` | BOOLEAN | No | Default `true` | Whether sync is active |
| `last_synced_at` | TIMESTAMP WITH TIME ZONE | Yes |  | Last successful sync timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No |  | Last update time |

## Notes
- Even if MVP starts with one calendar, model as one-to-many from day one

---

# 4) `calendar_events`

## Purpose
Stores fixed or externally synced commitments imported from Google Calendar.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `user_id` | UUID | No | FK → `users.id` | Owner |
| `connected_calendar_id` | UUID | No | FK → `connected_calendars.id` | Source calendar |
| `external_event_id` | VARCHAR | No | Unique per connected calendar | Provider event ID |
| `title` | VARCHAR | No |  | Event title |
| `description` | TEXT | Yes |  | Optional description |
| `location` | VARCHAR | Yes |  | Optional location |
| `start_at` | TIMESTAMP WITH TIME ZONE | No |  | Event start (UTC) |
| `end_at` | TIMESTAMP WITH TIME ZONE | No | `end_at > start_at` | Event end (UTC) |
| `is_all_day` | BOOLEAN | No | Default `false` | All-day flag |
| `is_recurring` | BOOLEAN | No | Default `false` | Recurrence flag |
| `recurrence_rule` | TEXT | Yes |  | Recurrence rule/raw recurrence data |
| `status` | VARCHAR | Yes |  | External event state |
| `is_busy` | BOOLEAN | No | Default `true` | Whether the event blocks scheduling |
| `raw_payload` | JSONB | Yes |  | Raw provider data |
| `last_synced_at` | TIMESTAMP WITH TIME ZONE | Yes |  | Last sync timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No |  | Last update time |

## Notes
- This table is for fixed/synced commitments only
- `raw_payload` preserves provider-specific data without schema bloat elsewhere

---

# 5) `tasks`

## Purpose
Stores user-created work items that Chronos will schedule.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `user_id` | UUID | No | FK → `users.id` | Owner |
| `title` | VARCHAR | No |  | Task title |
| `description` | TEXT | Yes |  | Optional description |
| `estimated_minutes` | INTEGER | No | `> 0` | Estimated effort |
| `deadline_at` | TIMESTAMP WITH TIME ZONE | Yes |  | Deadline |
| `priority` | VARCHAR / ENUM | No |  | `low`, `medium`, `high`, `urgent` |
| `task_type` | VARCHAR / ENUM | No |  | `deep`, `mechanical`, `unspecified` |
| `classification_source` | VARCHAR / ENUM | No |  | `manual`, `ai`, `rule` |
| `status` | VARCHAR / ENUM | No |  | `inbox`, `scheduled`, `in_progress`, `completed`, `deferred`, `cancelled` |
| `is_flexible` | BOOLEAN | No | Default `true` | Whether timing can move |
| `preferred_time_of_day` | VARCHAR | Yes |  | e.g. `morning`, `afternoon`, `evening` |
| `earliest_start_at` | TIMESTAMP WITH TIME ZONE | Yes |  | Earliest allowed schedule time |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No |  | Last update time |
| `archived_at` | TIMESTAMP WITH TIME ZONE | Yes |  | Soft delete marker |

## Notes
- Use minutes, not hours, for scheduling precision
- `classification_source` keeps room for AI/LLM integration

---

# 6) `schedules`

## Purpose
Represents a generated weekly schedule version.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `user_id` | UUID | No | FK → `users.id` | Owner |
| `week_start_date` | DATE | No |  | Week start |
| `week_end_date` | DATE | No | `week_end_date >= week_start_date` | Week end |
| `generation_type` | VARCHAR / ENUM | No |  | `initial`, `manual_replan`, `auto_replan_future` |
| `status` | VARCHAR / ENUM | No |  | `draft`, `active`, `replaced`, `archived` |
| `generated_at` | TIMESTAMP WITH TIME ZONE | No |  | Generation timestamp |
| `based_on_task_count` | INTEGER | Yes | >= 0 | Number of tasks considered |
| `based_on_event_count` | INTEGER | Yes | >= 0 | Number of fixed events considered |
| `notes` | TEXT | Yes |  | Optional generation notes |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No |  | Last update time |

## Notes
- Each replan should create a new schedule version instead of overwriting blindly

---

# 7) `schedule_sessions`

## Purpose
Stores actual generated work blocks placed inside a weekly schedule.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `schedule_id` | UUID | No | FK → `schedules.id` | Parent schedule |
| `user_id` | UUID | No | FK → `users.id` | Owner |
| `task_id` | UUID | Yes | FK → `tasks.id` | Linked task; nullable for future non-task sessions |
| `session_type` | VARCHAR / ENUM | No |  | `deep_work`, `mechanical`, `buffer`, `break` |
| `title` | VARCHAR | No |  | Session title |
| `planned_start_at` | TIMESTAMP WITH TIME ZONE | No |  | Planned start |
| `planned_end_at` | TIMESTAMP WITH TIME ZONE | No | `planned_end_at > planned_start_at` | Planned end |
| `planned_duration_minutes` | INTEGER | No | `> 0` | Planned duration |
| `actual_start_at` | TIMESTAMP WITH TIME ZONE | Yes |  | Actual start |
| `actual_end_at` | TIMESTAMP WITH TIME ZONE | Yes |  | Actual end |
| `actual_duration_minutes` | INTEGER | Yes | `>= 0` | Actual duration |
| `status` | VARCHAR / ENUM | No |  | `planned`, `completed`, `missed`, `skipped`, `partial`, `cancelled` |
| `source` | VARCHAR / ENUM | No |  | `rule_engine`, `ai_assisted`, `manual` |
| `position_index` | INTEGER | Yes | >= 0 | Order within schedule |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | No |  | Last update time |

## Notes
- This is the most important execution table in the product

---

# 8) `session_logs`

## Purpose
Tracks state changes and user actions on scheduled sessions.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `session_id` | UUID | No | FK → `schedule_sessions.id` | Linked session |
| `user_id` | UUID | No | FK → `users.id` | Owner |
| `action` | VARCHAR / ENUM | No |  | `marked_completed`, `marked_missed`, `marked_skipped`, `edited`, `rescheduled` |
| `reason_code` | VARCHAR | Yes |  | e.g. `interruption`, `underestimated_time`, `low_energy`, `calendar_conflict`, `user_choice` |
| `note` | TEXT | Yes |  | Optional user/system note |
| `logged_at` | TIMESTAMP WITH TIME ZONE | No |  | Action timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Row creation time |

## Notes
- Important for future learning and memory-style features

---

# 9) `weekly_summaries` (Optional Near-Term)

## Purpose
Stores weekly analytics and debrief snapshots for fast reporting.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `user_id` | UUID | No | FK → `users.id` | Owner |
| `schedule_id` | UUID | No | FK → `schedules.id` | Related schedule |
| `week_start_date` | DATE | No |  | Week start |
| `week_end_date` | DATE | No |  | Week end |
| `planned_minutes` | INTEGER | No | >= 0 | Total planned time |
| `completed_minutes` | INTEGER | No | >= 0 | Total completed time |
| `missed_minutes` | INTEGER | No | >= 0 | Total missed time |
| `completion_rate` | NUMERIC | Yes |  | Completion ratio |
| `deep_work_minutes` | INTEGER | No | >= 0 | Deep work total |
| `mechanical_minutes` | INTEGER | No | >= 0 | Mechanical work total |
| `summary_payload` | JSONB | Yes |  | Structured weekly summary data |
| `generated_at` | TIMESTAMP WITH TIME ZONE | No |  | Generation timestamp |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Row creation time |

## Notes
- Can be added just after MVP if analytics needs grow

---

# 10) `audit_logs` (Optional Later)

## Purpose
Stores operational audit/debug trail for important backend events.

## Attributes

| Field | Type | Null | Key / Rule | Description |
|---|---|---|---|---|
| `id` | UUID | No | PK | Primary identifier |
| `user_id` | UUID | Yes | FK → `users.id` | Related user, if applicable |
| `entity_type` | VARCHAR | No |  | e.g. `task`, `schedule`, `calendar_sync` |
| `entity_id` | UUID / VARCHAR | Yes |  | Related entity identifier |
| `action` | VARCHAR | No |  | Action performed |
| `metadata` | JSONB | Yes |  | Extra structured debug info |
| `created_at` | TIMESTAMP WITH TIME ZONE | No |  | Timestamp |

---

## 🔗 Relationship Model

```text
User
 ├── UserPreference (1:1 or 1:many versioned later)
 ├── ConnectedCalendar (1:many)
 │     └── CalendarEvent (1:many)
 ├── Task (1:many)
 ├── Schedule (1:many)
 │     └── ScheduleSession (1:many)
 │            └── SessionLog (1:many)
 └── WeeklySummary (1:many)
```

---

## 🔄 Scheduling Flow (MVP)

1. Read user preferences
2. Read active tasks
3. Read synced fixed events from `calendar_events`
4. Compute free time windows in memory
5. Generate a new schedule record in `schedules`
6. Insert generated work blocks into `schedule_sessions`

Do **not** store a `free_time_windows` table in MVP. Free windows are derived state and should be computed dynamically.

---

## ⏱️ Time Strategy

- Store all timestamps in **UTC**
- Convert to user timezone in frontend
- Store user timezone in `users.timezone`

This is required for calendar correctness.

---

## 🧩 Key Enums

### Task Priority
- `low`
- `medium`
- `high`
- `urgent`

### Task Type
- `deep`
- `mechanical`
- `unspecified`

### Task Status
- `inbox`
- `scheduled`
- `in_progress`
- `completed`
- `deferred`
- `cancelled`

### Classification Source
- `manual`
- `ai`
- `rule`

### Schedule Generation Type
- `initial`
- `manual_replan`
- `auto_replan_future`

### Schedule Status
- `draft`
- `active`
- `replaced`
- `archived`

### Session Type
- `deep_work`
- `mechanical`
- `buffer`
- `break`

### Session Status
- `planned`
- `completed`
- `missed`
- `skipped`
- `partial`
- `cancelled`

### Session Source
- `rule_engine`
- `ai_assisted`
- `manual`

### Session Log Action
- `marked_completed`
- `marked_missed`
- `marked_skipped`
- `edited`
- `rescheduled`

---

## 📈 Indexing Strategy

| Table | Index |
|---|---|
| `users` | `unique(email)` |
| `calendar_events` | `(user_id, start_at)` |
| `calendar_events` | `(user_id, end_at)` |
| `calendar_events` | `unique(connected_calendar_id, external_event_id)` |
| `tasks` | `(user_id, status)` |
| `tasks` | `(user_id, deadline_at)` |
| `tasks` | `(user_id, priority)` |
| `schedules` | `(user_id, week_start_date)` |
| `schedules` | `(user_id, status)` |
| `schedule_sessions` | `(schedule_id)` |
| `schedule_sessions` | `(user_id, planned_start_at)` |
| `schedule_sessions` | `(user_id, status)` |
| `schedule_sessions` | `(task_id)` |
| `session_logs` | `(session_id, logged_at)` |

---

## 🧼 Data Integrity Rules

### General
- all datetime values stored in UTC
- durations must not be negative

### `calendar_events`
- `end_at > start_at`
- `external_event_id` must be unique per connected calendar

### `tasks`
- `estimated_minutes > 0`

### `schedules`
- `week_end_date >= week_start_date`

### `schedule_sessions`
- `planned_end_at > planned_start_at`
- `planned_duration_minutes > 0`
- `actual_duration_minutes >= 0` when present

---

## 🗑️ Deletion Strategy

| Entity | Strategy |
|---|---|
| `tasks` | Soft delete via `archived_at` |
| `calendar_events` | Hard delete and re-sync safe |
| `schedule_sessions` | Hard delete when replacing schedule versions |
| `connected_calendars` | Disable sync instead of deleting immediately |

Do not soft-delete everything by default. That creates unnecessary query complexity.

---

## 🧠 AI / Future Readiness

This design supports future AI and LLM integration without forcing AI into the MVP core.

### Future-friendly fields already planned
- `tasks.classification_source`
- `calendar_events.raw_payload`
- `weekly_summaries.summary_payload`
- `audit_logs.metadata`

### Future tables that can be added later
- `agent_runs`
- `task_classification_history`
- `schedule_generation_runs`
- `user_behavior_patterns`
- `notification_events`

---

## 🧭 Final Summary

- **Database:** PostgreSQL
- **Modeling Style:** Relational SQL schema with separate time tables
- **Architecture:** Modular monolith
- **Time Handling:** UTC-based storage with user timezone conversion
- **Core Scheduling Rule:** `TimeBlock` is an internal abstraction only

### Core Tables
- `users`
- `user_preferences`
- `connected_calendars`
- `calendar_events`
- `tasks`
- `schedules`
- `schedule_sessions`
- `session_logs`

### Optional Near-Term
- `weekly_summaries`

### Optional Later
- `audit_logs`

### Key Modeling Rule
- fixed commitments are stored in `calendar_events`
- generated work chunks are stored in `schedule_sessions`

---

## 🧱 Core Principle

Chronos is not just a task manager.  
It is a **time allocation and scheduling engine** built on a clean separation between external commitments and internally generated work sessions.
