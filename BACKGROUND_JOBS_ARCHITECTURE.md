# ClubFlow Background Job Architecture

ClubFlow should keep API handlers responsible for validation, authorization, primary database writes, and response shaping. Expensive or failure-prone side effects should move to Redis-backed BullMQ queues so user requests are not blocked by email providers, reminder scans, notification fan-out, audit persistence, or recurring task generation.

## Why Queues Are Necessary

Synchronous side effects make every API request as slow and fragile as the slowest downstream operation. If SMTP is slow, Redis is unavailable, or a notification fan-out touches many users, the user-facing request waits or fails even though the core action already succeeded.

Queues give ClubFlow a durable buffer between user actions and background work:

- API latency stays tied to the primary action, not email or reminder delivery.
- Workers can retry transient failures without asking users to repeat requests.
- Workload spikes are absorbed by Redis and drained with controlled concurrency.
- Scheduled work runs in dedicated worker processes instead of inside every API pod.
- Failed jobs are visible, inspectable, and replayable through a dead-letter path.

## What Becomes Async

Keep synchronous:

- Authentication, authorization, input validation, and tenant/club permission checks.
- Primary writes that define the user-visible result, such as creating a task, joining a club, updating task status, or saving a reset token.
- Reads needed to form the API response.

Move async:

- Email sending, including password reset and invite emails.
- Notification creation and fan-out for task assignment, mentions, club invites, event updates, and system alerts.
- Audit log creation after business actions.
- Delayed task reminders and event reminders.
- Recurring task generation.
- Old notification and audit log cleanup.
- Digest jobs and analytics rollups.

## Queue Architecture

Redis is the broker. BullMQ queues hold jobs. API processes produce jobs. Worker processes consume jobs. Workers connect to MongoDB and Redis independently from the API server.

Queues:

- `clubflow.email`: SMTP and transactional email delivery.
- `clubflow.notifications`: in-app notification writes and later real-time fan-out hooks.
- `clubflow.audit`: audit log persistence.
- `clubflow.tasks`: task reminder scans, recurring task generation, event reminder scans.
- `clubflow.maintenance`: cleanup jobs and retention policies.
- `clubflow.dead-letter`: terminal failure capture.

Runtime topology:

```text
Client -> Express API -> MongoDB primary write
                     -> BullMQ producer -> Redis queue

Worker process -> BullMQ worker -> MongoDB / SMTP / side effects
                              -> retry or dead-letter on failure
```

## Folder Structure

Implemented structure:

```text
backend/
  config/
    redis.js
  jobs/
    index.js
    jobNames.js
    queueNames.js
    queueManager.js
    workerManager.js
    retryStrategy.js
    failureHandler.js
    scheduler.js
    producers/
      audit.producer.js
      email.producer.js
      notification.producer.js
      task.producer.js
    processors/
      audit.processor.js
      deadLetter.processor.js
      email.processor.js
      notification.processor.js
      scheduled.processor.js
    workers/
      index.js
  models/
    JobFailure.model.js
```

Scripts:

```bash
npm run start
npm run worker
npm run worker:dev
```

## Queue Manager

`backend/jobs/queueManager.js` centralizes BullMQ `Queue` and `QueueEvents` instances. Producers call `addJob(queueName, jobName, data, options)` rather than constructing queues directly.

Production behavior:

- One stable Redis connection factory via `backend/config/redis.js`.
- Shared default retention policies for completed and failed jobs.
- Queue events for failed and stalled job observability.
- Graceful shutdown through `closeQueues()` and `closeRedisConnection()`.

API server behavior:

- Set `BACKGROUND_JOBS_ENABLED=true` to initialize producers and skip legacy in-process cron.
- Start workers separately with `npm run worker`.

## Worker Manager

`backend/jobs/workerManager.js` owns worker construction and concurrency:

- Email concurrency: `EMAIL_WORKER_CONCURRENCY`, default `5`.
- Notification concurrency: `NOTIFICATION_WORKER_CONCURRENCY`, default `10`.
- Audit concurrency: `AUDIT_WORKER_CONCURRENCY`, default `20`.
- Task scheduler concurrency: `TASK_WORKER_CONCURRENCY`, default `3`.
- Maintenance concurrency: `MAINTENANCE_WORKER_CONCURRENCY`, default `2`.
- Dead-letter concurrency: `DEAD_LETTER_WORKER_CONCURRENCY`, default `2`.

This lets ClubFlow scale workers independently:

- Add email workers when SMTP throughput is the bottleneck.
- Add notification workers during large club events.
- Keep audit concurrency high because audit writes are cheap and isolated.
- Keep scheduled task concurrency lower to protect MongoDB from large scans.

## Retry Strategy

`backend/jobs/retryStrategy.js` defines retry profiles:

- Email: 5 attempts, exponential backoff starting at 30 seconds.
- Notification: 4 attempts, exponential backoff starting at 10 seconds.
- Audit: 8 attempts, exponential backoff starting at 5 seconds.
- Scheduled jobs: 3 attempts, exponential backoff starting at 60 seconds.
- Dead-letter capture: 3 attempts.

Guidelines:

- Use retries for transient failures: network resets, SMTP rate limits, temporary MongoDB disconnects.
- Do not retry permanently invalid payloads; processors validate required fields and fail quickly.
- Use deterministic `jobId` values for idempotent operations such as password reset emails and repeatable scans.
- Add idempotency checks in processors before creating duplicate user-visible records.

## Delayed And Repeatable Jobs

Delayed jobs:

- Use `delay` in producer options for future reminders or scheduled emails.
- Use stable `jobId` values when a delayed job represents a single domain event.

Repeatable jobs:

- `backend/jobs/scheduler.js` registers repeatable BullMQ jobs.
- Defaults mirror the legacy cron cadence:
  - overdue tasks: `0 9 * * *`
  - due-soon tasks: `0 * * * *`
  - event reminders: `0 * * * *`
  - notification cleanup: `0 0 * * 0`
  - audit cleanup: `0 0 1 * *`

Recurring tasks:

- `task.recurring.generate` creates a future task from a source recurring task.
- The next production hardening step is to add explicit `recurrence.parentTask`, `recurrence.instanceKey`, and `recurrence.nextRunAt` fields so recurring generation is globally idempotent across retries and deployments.

## Failure Handling

Workers call `enqueueDeadLetter(job, error)` when attempts are exhausted. The dead-letter worker persists terminal failures to `JobFailure` with:

- queue name
- job name
- job id
- attempts made
- failure reason
- stack trace
- original payload
- status: `open`, `replayed`, or `ignored`

Operational policy:

- Alert on dead-letter count greater than zero for email, notification, audit, and task queues.
- Keep failed BullMQ jobs in Redis for short-term debugging.
- Keep `JobFailure` in MongoDB for durable investigation and replay tooling.
- Replay only after the processor bug or external dependency issue is fixed.

## Job Naming Conventions

Use dot-delimited names:

```text
<domain>.<action>[.<qualifier>]
```

Examples:

- `email.send`
- `notification.create`
- `notification.digest.daily`
- `audit.log.create`
- `task.scan.overdue`
- `task.scan.due-soon`
- `task.recurring.generate`
- `event.scan.reminders`
- `notification.cleanup.old`
- `audit.cleanup.old`
- `dead-letter.capture`

Job ID conventions:

- `password-reset:<userId>:<resetTokenHash>`
- `task-assigned:<taskId>:<userId>`
- `audit:<entityType>:<entityId>:<action>:<timestamp-or-request-id>`
- `recurring-task:<sourceTaskId>:<yyyy-mm-dd>`
- Repeatable scan jobs use their job name as `jobId`.

## Queue Monitoring Strategy

Recommended stack:

- Bull Board or Arena for queue inspection in admin-only environments.
- Prometheus metrics for queue depth, completed count, failed count, stalled count, retry count, and processing duration.
- Winston logs already capture worker lifecycle and job failures.
- Alerts on dead-letter growth, stalled jobs, Redis connection failures, and sustained queue lag.

Minimum dashboards:

- Queue depth by queue.
- Oldest waiting job age.
- Job success/failure rate.
- Worker concurrency and active job count.
- Dead-letter count by queue and job name.
- Redis memory usage and connection count.

Security:

- Never expose queue dashboards publicly.
- Protect queue dashboards behind admin auth, VPN, or private network access.
- Redact secrets from job payloads. Store token hashes, ids, and templates, not raw credentials.

## Scalability Impact

Queues improve scalability by separating request throughput from background throughput. The API can return after the primary MongoDB write, while workers drain Redis at a rate controlled by concurrency and horizontal replicas.

Queues prevent API slowdowns because:

- Slow SMTP calls no longer sit inside request-response time.
- Reminder scans do not run inside API pods.
- Large notification fan-outs are broken into jobs and retried independently.
- Audit log outages do not make core user actions fail.
- Worker concurrency protects MongoDB and external providers from uncontrolled bursts.

## Production Environment Variables

```env
BACKGROUND_JOBS_ENABLED=true
REDIS_URL=redis://localhost:6379

EMAIL_WORKER_CONCURRENCY=5
NOTIFICATION_WORKER_CONCURRENCY=10
AUDIT_WORKER_CONCURRENCY=20
TASK_WORKER_CONCURRENCY=3
MAINTENANCE_WORKER_CONCURRENCY=2
DEAD_LETTER_WORKER_CONCURRENCY=2

EMAIL_JOB_ATTEMPTS=5
NOTIFICATION_JOB_ATTEMPTS=4
AUDIT_JOB_ATTEMPTS=8
SCHEDULED_JOB_ATTEMPTS=3

OVERDUE_TASKS_CRON=0 9 * * *
DUE_SOON_TASKS_CRON=0 * * * *
EVENT_REMINDERS_CRON=0 * * * *
NOTIFICATION_CLEANUP_CRON=0 0 * * 0
AUDIT_CLEANUP_CRON=0 0 1 * *
```

## Migration Plan

1. Enable Redis in local and staging.
2. Start one API process with `BACKGROUND_JOBS_ENABLED=true`.
3. Start one worker process with `npm run worker`.
4. Move email first because it is external and failure-prone.
5. Move notification creation with idempotent `jobId` values.
6. Move audit logs after adding request-id based job ids.
7. Replace legacy cron entirely once BullMQ scheduled jobs are verified.
8. Add admin replay tooling for `JobFailure`.
9. Add Bull Board or metrics dashboards.
10. Scale workers independently based on queue depth and job age.
