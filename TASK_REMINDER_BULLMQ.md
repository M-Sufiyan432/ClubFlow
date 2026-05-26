# Production Task Reminders With BullMQ

This implementation follows:

```text
API -> BullMQ delayed job -> worker -> notification service -> MongoDB notification
```

## Queue Setup

Redis config lives in `backend/config/redis.js`.

BullMQ queue setup lives in:

- `backend/jobs/queueNames.js`
- `backend/jobs/jobNames.js`
- `backend/jobs/queueManager.js`
- `backend/jobs/retryStrategy.js`

The task reminder job name is:

```text
task.reminder.send
```

It runs on:

```text
clubflow.tasks
```

## Reminder Scheduling Logic

Scheduling lives in `backend/jobs/producers/task.producer.js`.

Default reminder offsets:

```text
1440 minutes before due date
60 minutes before due date
```

Override with:

```env
TASK_REMINDER_OFFSETS_MINUTES=1440,60,15
```

The API schedules reminders when:

- a task is created
- a task due date changes
- users are assigned to a task
- a task is moved back to a non-completed status

The API only schedules jobs when:

```env
BACKGROUND_JOBS_ENABLED=true
```

## Delayed Jobs

BullMQ delayed jobs let ClubFlow enqueue reminder work now and execute it later.

Example:

```js
await queue.add('task.reminder.send', payload, {
  delay: reminderAt - Date.now(),
  jobId: 'task-reminder:<taskId>:<userId>:<dueDateMs>:<offset>'
});
```

If the reminder time is already inside the reminder window but the task is not due yet, the delay is `0`, so the worker can notify the assignee immediately.

## Worker Implementation

Worker startup:

```bash
npm run worker
```

Worker manager:

```text
backend/jobs/workerManager.js
```

Task processor:

```text
backend/jobs/processors/task.processor.js
backend/jobs/processors/taskReminder.processor.js
```

The worker re-reads the task before sending a notification. It skips stale jobs when:

- the task was deleted
- the task is archived
- the task is completed
- the due date changed after this job was scheduled
- the recipient is no longer assigned
- the task is already due

That makes old delayed jobs safe after due-date edits.

## Idempotency Strategy

Idempotency is enforced at two layers.

BullMQ job id:

```text
task-reminder:<taskId>:<userId>:<dueDateMs>:<reminderMinutesBefore>
```

Notification uniqueness:

```text
recipient + type + data.taskId + data.metadata.reminderKey
```

The `reminderKey` is:

```text
<taskId>:<userId>:<dueDateMs>:<reminderMinutesBefore>
```

This prevents duplicate reminders from retries, duplicate API calls, and worker restarts.

## Retries

Reminder jobs use the notification retry profile in `backend/jobs/retryStrategy.js`:

```js
attempts: 4
backoff: { type: 'exponential', delay: 10000 }
```

Transient MongoDB or Redis errors are retried automatically. After all attempts are exhausted, the worker moves the job to the dead-letter queue:

```text
clubflow.dead-letter
```

Terminal failures are persisted in:

```text
backend/models/JobFailure.model.js
```

## Concurrency

Task reminders share the task worker concurrency:

```env
TASK_WORKER_CONCURRENCY=3
```

Raise it when reminders pile up. Lower it if MongoDB or notification writes are under pressure.

## Scaling Workers

Scale API and workers separately.

API processes:

- validate requests
- write task changes
- enqueue reminder jobs
- return quickly

Worker processes:

- consume delayed jobs
- retry failures
- create notifications
- absorb traffic spikes

Horizontal scaling is straightforward:

```bash
npm run worker
npm run worker
npm run worker
```

BullMQ ensures each job is processed by one worker at a time. More worker replicas increase throughput without changing API code.
