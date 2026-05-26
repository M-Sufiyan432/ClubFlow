# ClubFlow Recurring Tasks With BullMQ

This implementation generates recurring task instances through BullMQ:

```text
repeatable scanner job -> deterministic generation job -> MongoDB task instance -> reminder jobs
```

## Supported Recurrence

Supported frequencies:

- `daily`
- `weekly`
- `monthly`

The existing fields still drive the schedule:

```text
isRecurring
recurrence.frequency
recurrence.interval
recurrence.endDate
```

Additional production fields were added under `recurrence`:

```text
recurrence.parentTask
recurrence.rootTask
recurrence.occurrenceKey
recurrence.nextRunAt
recurrence.lastGeneratedAt
```

These fields preserve lineage and make generation idempotent.

## Worker Flow

The repeatable scheduler registers:

```text
task.recurring.scan
```

Default cron:

```env
RECURRING_TASKS_CRON=*/15 * * * *
```

The scanner finds recurring templates that are ready, then enqueues one deterministic job:

```text
task.recurring.generate
```

Generation job id:

```text
recurring-task:<templateTaskId>:<occurrenceKey>
```

The occurrence key is currently the ISO date portion of the generated due date:

```text
yyyy-mm-dd
```

## Duplicate Prevention

Duplicates are prevented at two layers.

BullMQ:

```text
jobId = recurring-task:<templateTaskId>:<occurrenceKey>
```

MongoDB partial unique index:

```text
recurrence.parentTask + recurrence.occurrenceKey
```

If two workers race, only one task instance can be inserted. The losing worker catches duplicate key errors and returns the existing task id.

## History Linkage

Generated task instances store:

```text
recurrence.parentTask = original recurring template
recurrence.rootTask = root recurring template
recurrence.occurrenceKey = generated occurrence date key
```

The generated task history includes a `created` entry with `field: recurrence.parentTask`, linking the instance back to its template.

Generated instances use:

```text
isRecurring = false
```

That prevents generated instances from recursively creating more tasks. Only the original template remains the generator.

## DB Query Optimization

The task model now includes indexes for:

```text
isRecurring + isArchived + recurrence.frequency + recurrence.nextRunAt + dueDate
```

and the unique lineage index:

```text
recurrence.parentTask + recurrence.occurrenceKey
```

The scanner selects only fields needed to enqueue generation jobs and limits each scan:

```env
RECURRING_TASK_SCAN_LIMIT=100
```

## Cron vs Delayed Jobs

Use cron-like repeatable jobs for discovery:

- Good for scanning templates.
- Easy to recover after downtime.
- Avoids scheduling thousands of far-future delayed jobs.

Use delayed jobs for exact per-instance work:

- Good for reminders before a due date.
- Good when the target execution time is known and specific.

For recurring tasks, ClubFlow uses a hybrid:

- `task.recurring.scan` runs on a repeatable schedule.
- `task.recurring.generate` is a deterministic generation job.
- The generated task then schedules delayed reminder jobs.

## Scaling Recurring Systems

Scale workers horizontally with:

```bash
npm run worker
```

BullMQ ensures a job is processed by one worker at a time. MongoDB unique indexes protect correctness even if multiple workers enqueue or attempt the same occurrence.

Recommended production settings:

```env
TASK_WORKER_CONCURRENCY=3
RECURRING_TASKS_CRON=*/15 * * * *
RECURRING_TASK_SCAN_LIMIT=100
```

Raise `TASK_WORKER_CONCURRENCY` when queue lag grows. Raise `RECURRING_TASK_SCAN_LIMIT` only after checking MongoDB load and index usage.
