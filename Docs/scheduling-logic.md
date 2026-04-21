# Chronos Scheduling Logic (Current + Future Scope)

This document explains the current rule-based scheduler in Phase 2, including input contracts, core algorithm flow, persistence behavior, and planned extensions.

## 1) Purpose

The scheduling engine converts:

- user preferences
- user tasks
- busy calendar events

into a weekly set of planned focus sessions (`schedule_sessions`) for one user and one week, fully in UTC.

## 2) Current Architecture

The scheduling behavior is split into two layers:

- **Pure algorithm layer** in `app/services/scheduling_engine.py`
  - no database calls
  - deterministic schedule construction from Python objects
- **DB orchestration layer** in `build_schedule(...)`
  - fetches data
  - calls pure functions
  - persists schedule + sessions
  - updates task statuses

## 3) Core Dataclasses

### TimeWindow

- `start: datetime`
- `end: datetime`
- `duration_minutes` property

Represents both busy and free windows in UTC.

### TaskToSchedule

- `task_id, title`
- `estimated_minutes, remaining_minutes`
- `priority, task_type`
- `deadline_at`
- `preferred_time_of_day`
- `is_flexible`

Represents normalized task input for scheduler operations.

### PlannedSession

- `task_id, title`
- `session_type`
- `start, end`
- `duration_minutes`
- `position_index`

Represents one planned output block before DB persistence.

## 4) Pure Functions (Current Behavior)

### `compute_free_windows(...)`

Inputs:

- week boundaries (UTC datetimes)
- busy blocks (calendar events)
- work hours (`work_start_time`, `work_end_time`)
- allowed weekdays (`work_days`)

Process:

1. Iterate each day in the target week
2. Keep only allowed weekdays
3. Build workday base window (`day_start` to `day_end`)
4. Subtract all overlapping busy blocks
5. Keep only windows with duration >= 15 minutes
6. Return sorted free windows by start time

Output:

- chronologically sorted free `TimeWindow[]`

### `split_task_into_sessions(task, session_minutes)`

Splits `task.remaining_minutes` into chunks of `session_minutes`, with final remainder chunk.

Example:

- `100` minutes with `45`-minute sessions => `[45, 45, 10]`

### `score_window_for_task(window, task, prefs)`

A lightweight scoring utility (non-ML) that adds points for:

- preferred time-of-day match
- deep-work alignment with productive hours
- urgency proximity to deadline

This function exists for better future placement strategies and experimentation.

### `generate_schedule(tasks, free_windows, session_minutes, break_minutes)`

Current rules:

1. Sort tasks by weight:
   - base priority weight (`urgent > high > medium > low`)
   - +2 boost if deadline within 48 hours
2. For each task, split into chunks
3. For each chunk, place in first free window that can fit it
4. After placement, advance that window by:
   - `chunk_duration + break_minutes`
5. Drop windows with <15 minutes left
6. If no window fits a chunk, leave remaining task unscheduled (silent skip)
7. Return chronological session list with `position_index`

## 5) DB Entry Point: `build_schedule(...)`

`build_schedule(db, user_id, week_start_date, generation_type)` performs:

1. Fetch user + preferences
2. Fetch candidate tasks:
   - `status in ("inbox","scheduled")`
   - `archived_at is null`
   - `deadline_at is null OR deadline_at >= week_start`
3. Fetch overlapping busy calendar events for week
4. Build free windows using preference work hours/work days
5. Convert tasks to `TaskToSchedule`
6. Generate planned sessions via pure algorithm
7. Mark existing active schedule for same week as `replaced`
8. Create new `schedules` row with `status="active"`
9. Insert `schedule_sessions` rows
10. Set `task.status="scheduled"` for tasks that received sessions
11. Commit and return schedule with eager-loaded sessions

## 6) Current Constraints and Trade-offs

- Greedy first-fit allocation (fast, predictable, but not globally optimal)
- No explicit fragmentation minimization beyond 15-minute cutoff
- No fairness balancing across all tasks when windows are scarce
- Uses a single default session length (not adaptive per task complexity)
- No dynamic re-planning for in-week disruptions yet (Phase 3+)

## 7) Why This Design Works for MVP

- Easy to reason about and debug
- Stable deterministic outputs for same inputs
- Good baseline for user trust and explainability
- Simple enough to test with pure unit tests
- Ready for incremental sophistication without large rewrite

## 8) Future Scope (Planned Evolution)

### A. Better Window Selection

- Score-aware placement (`score_window_for_task`) instead of strict first-fit
- Tie-breakers for:
  - lower context-switching
  - better deadline safety margin
  - contiguous focus blocks

### B. Smarter Session Strategy

- Variable session sizes by task type/priority/deadline
- Auto-insert buffer blocks (e.g., transition/recovery windows)
- Separate break policy for deep vs mechanical tasks

### C. Constraint Expansion

- Hard earliest/latest bounds per task
- Min/max sessions per day
- Explicit weekend fallback policy and user override rules
- Support fixed commitments generated from non-calendar inputs

### D. Replanning and Adaptation

- Mid-week replan endpoints (manual and automatic)
- Session completion feedback loops (`session_logs`)
- Deferred task carry-over strategies
- Drift detection when actual execution diverges from plan

### E. Explainability and UX Data

- Per-session reasoning payload (why this slot was chosen)
- Unscheduled-task explanations
- Capacity reports (demand vs available windows)
- Lightweight recommendation hints for user preference tuning

### F. Performance and Quality

- Batch scheduling optimizations for heavy task loads
- Extensive edge-case test suites (timezone, DST, all-day event expansion)
- Property-based tests for algorithm invariants
- Deterministic seed/options for reproducible schedule simulations

## 9) Testing Strategy (Current)

Unit tests target pure scheduler functions only:

- free window generation from busy blocks
- task splitting behavior
- scoring preference sanity
- priority-driven session ordering

This keeps the algorithm independently verifiable from API/DB layers.
