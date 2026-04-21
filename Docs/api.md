# Chronos AI Backend API (Phase 2)

This document describes the currently implemented backend APIs for the Chronos AI Phase 2 scope.

## Base Information

- Base URL: `http://localhost:8000`
- API prefix: `/api/v1`
- Authentication: Bearer JWT (`Authorization: Bearer <token>`)
- Time standard: UTC for stored and returned timestamps
- Content type: `application/json`

## Authentication APIs

### POST `/api/v1/auth/register`

Create a new email/password user and issue an access token.

- Auth required: No
- Request body:
  - `email: string`
  - `password: string`
  - `full_name: string | null`
  - `timezone: string` (default: `"UTC"`)
- Response `200`:
  - `access_token: string`
  - `token_type: "bearer"`
- Errors:
  - `400` if email already exists

### POST `/api/v1/auth/login`

Log in with email and password.

- Auth required: No
- Request body:
  - `email: string`
  - `password: string`
- Response `200`:
  - `access_token: string`
  - `token_type: "bearer"`
- Errors:
  - `401` invalid credentials or inactive account

### GET `/api/v1/auth/google`

Get Google OAuth authorization URL.

- Auth required: No
- Response `200`:
  - `authorization_url: string`

### GET `/api/v1/auth/google/callback?code=...`

Handle Google OAuth callback, upsert user/calendar auth state, and return JWT.

- Auth required: No
- Query params:
  - `code: string` (required)
- Response `200`:
  - `access_token: string`
  - `token_type: "bearer"`

### GET `/api/v1/auth/me`

Return current authenticated user profile.

- Auth required: Yes
- Response `200`:
  - `id: uuid`
  - `email: string`
  - `full_name: string | null`
  - `timezone: string`
  - `auth_provider: string`
  - `is_active: bool`
  - `created_at: datetime`

## Task APIs

All task routes are user-scoped and authenticated; users can only access their own tasks.

### POST `/api/v1/tasks`

Create a task.

- Auth required: Yes
- Request body:
  - `title: string` (required)
  - `description: string | null`
  - `estimated_minutes: int` (`> 0`, required)
  - `deadline_at: datetime | null`
  - `priority: "low" | "medium" | "high" | "urgent"` (default `"medium"`)
  - `task_type: "deep" | "mechanical" | "unspecified"` (default `"unspecified"`)
  - `preferred_time_of_day: "morning" | "afternoon" | "evening" | null`
  - `earliest_start_at: datetime | null`
  - `is_flexible: bool` (default `true`)
- Response `201`: `TaskResponse`

### GET `/api/v1/tasks`

List tasks (non-archived only), with optional status filter and pagination.

- Auth required: Yes
- Query params:
  - `status: string | null`
  - `skip: int` (default `0`)
  - `limit: int` (default `50`)
- Response `200`: `TaskResponse[]`

### GET `/api/v1/tasks/{task_id}`

Get one task by ID.

- Auth required: Yes
- Path params:
  - `task_id: uuid`
- Response `200`: `TaskResponse`
- Errors:
  - `404` task not found / not owned by user / archived

### PATCH `/api/v1/tasks/{task_id}`

Partial task update.

- Auth required: Yes
- Path params:
  - `task_id: uuid`
- Request body: `TaskUpdate`
  - Same fields as `TaskCreate` but optional, plus `status`
  - Only non-null provided fields are applied
- Response `200`: `TaskResponse`

### DELETE `/api/v1/tasks/{task_id}`

Soft delete task by setting `archived_at`.

- Auth required: Yes
- Path params:
  - `task_id: uuid`
- Response `204 No Content`

## Calendar APIs

All calendar routes are authenticated and user-scoped.

### GET `/api/v1/calendar/connected`

List connected calendars for current user.

- Auth required: Yes
- Response `200`: `ConnectedCalendarResponse[]`
  - `id, provider, calendar_id, calendar_name, is_primary, sync_enabled, last_synced_at`

### POST `/api/v1/calendar/sync/{connected_calendar_id}`

Sync one connected calendar from Google Calendar into `calendar_events`.

- Auth required: Yes
- Path params:
  - `connected_calendar_id: uuid`
- Response `200`: `CalendarSyncResponse`
  - `calendar_id: string`
  - `events_synced: int`
  - `last_synced_at: datetime`
- Sync behavior:
  - refreshes Google token if expired
  - reads rolling window from current week start to +4 weeks
  - skips cancelled/free events
  - upserts busy events by `(connected_calendar_id, external_event_id)`

### GET `/api/v1/calendar/events`

Read busy events for one week.

- Auth required: Yes
- Query params:
  - `week_start: date` (required)
- Response `200`: `CalendarEventResponse[]`
  - `id, title, start_at, end_at, is_all_day`

## Schedule APIs

### POST `/api/v1/schedule/generate`

Generate (or regenerate) schedule for a given week.

- Auth required: Yes
- Request body:
  - `week_start_date: date` (must be Monday)
  - `generation_type: string` (default `"initial"`)
- Response `201`: `ScheduleResponse`
- Behavior:
  - uses rule engine to build sessions from tasks + busy calendar events
  - marks prior active schedule for same week as `"replaced"`
  - creates new schedule as `"active"`
  - marks scheduled tasks as `status="scheduled"`

### GET `/api/v1/schedule?week_start_date=YYYY-MM-DD`

Fetch schedule for the given week.

- Auth required: Yes
- Query params:
  - `week_start_date: date` (required)
- Response `200`: `ScheduleResponse`
- Errors:
  - `404` if not found

### GET `/api/v1/schedule/{schedule_id}`

Fetch schedule by ID.

- Auth required: Yes
- Path params:
  - `schedule_id: uuid`
- Response `200`: `ScheduleResponse`
- Errors:
  - `404` if not found / not owned by user

## User Preference APIs

### GET `/api/v1/users/me/preferences`

Read current user scheduling preferences.

- Auth required: Yes
- Response `200`: `UserPreferencesResponse`

### PATCH `/api/v1/users/me/preferences`

Partially update user preferences.

- Auth required: Yes
- Request body: `UserPreferencesUpdate` (all fields optional)
- Response `200`: `UserPreferencesResponse`

## Primary Response Schemas

### TaskResponse

- `id, user_id, title, description, estimated_minutes, deadline_at`
- `priority, task_type, classification_source, status`
- `is_flexible, preferred_time_of_day, earliest_start_at`
- `archived_at, created_at, updated_at`

### ScheduleResponse

- `id, user_id, week_start_date, week_end_date`
- `generation_type, status, generated_at`
- `based_on_task_count, based_on_event_count`
- `sessions: ScheduleSessionResponse[]`

### ScheduleSessionResponse

- `id, schedule_id, task_id, session_type, title`
- `planned_start_at, planned_end_at, planned_duration_minutes`
- `status, source, position_index`

## Error Model (Current Behavior)

- `400`: invalid request or business rule violation
- `401`: authentication/authorization failure
- `404`: resource not found in user scope
- `422`: schema validation errors (FastAPI/Pydantic)
- `502`: upstream Google API failure during sync
