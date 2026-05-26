# ClubFlow Virus Scanning Workflow

ClubFlow now treats private uploaded files as untrusted until a background scanner marks them safe.

```text
upload -> metadata pending/queued -> BullMQ scan job -> scan worker -> DB status update
```

## File Status Model

Task attachments now include scan and moderation fields:

```js
{
  scanStatus: 'pending' | 'queued' | 'scanning' | 'safe' | 'infected' | 'failed' | 'blocked',
  scanProvider: String,
  scanJobId: String,
  scanDetails: Object,
  scannedAt: Date,
  quarantineReason: String,
  moderatedBy: ObjectId,
  moderatedAt: Date,
  moderationNote: String
}
```

Download is allowed only when:

```text
scanStatus === safe
```

Infected, blocked, failed, queued, pending, and scanning files are not downloadable through the signed download endpoint.

## Queue Jobs

Queue:

```text
clubflow.attachments
```

Jobs:

```text
attachment.scan
attachment.scan.cleanup
```

Producer:

```text
backend/jobs/producers/attachment.producer.js
```

Worker:

```text
backend/jobs/processors/attachmentScan.processor.js
```

Scanner service:

```text
backend/services/virusScanner.service.js
```

## Upload Flow

1. Frontend requests a signed upload URL.
2. Frontend uploads directly to S3.
3. Frontend calls `POST /api/tasks/:taskId/attachments/complete`.
4. Backend validates the object exists and saves metadata.
5. Attachment starts as `pending`, then `queued`.
6. Backend enqueues `attachment.scan`.
7. Worker marks file `scanning`.
8. Scanner marks file `safe` or `infected`.
9. Downloads remain blocked unless status is `safe`.

## Providers

Local development default:

```env
ATTACHMENT_SCAN_PROVIDER=noop
```

ClamAV:

```env
ATTACHMENT_SCAN_PROVIDER=clamav
CLAMAV_HOST=127.0.0.1
CLAMAV_PORT=3310
CLAMAV_TIMEOUT_MS=30000
```

VirusTotal:

```env
ATTACHMENT_SCAN_PROVIDER=virustotal
VIRUSTOTAL_API_KEY=...
VIRUSTOTAL_MAX_POLLS=8
VIRUSTOTAL_POLL_DELAY_MS=15000
```

`noop` marks files safe and should only be used for local development.

## Retry Logic

Attachment scan jobs use the scan retry profile:

```js
attempts: 3
backoff: { type: 'exponential', delay: 120000 }
```

This handles temporary scanner outages, S3 read failures, network resets, and VirusTotal delays.

After all attempts fail, BullMQ dead-letter handling records the job. The cleanup job also marks stale pending/scanning attachments as `failed`.

## Cleanup Flow

Repeatable cleanup job:

```text
attachment.scan.cleanup
```

Default schedule:

```env
ATTACHMENT_SCAN_CLEANUP_CRON=*/30 * * * *
```

Stale threshold:

```env
ATTACHMENT_SCAN_STALE_MINUTES=60
```

Cleanup marks old `pending`, `queued`, or `scanning` files as `failed`, which keeps them blocked until a moderator intervenes.

## Moderation

Moderation route:

```text
PATCH /api/tasks/:taskId/attachments/:attachmentId/moderation
```

Body:

```json
{
  "scanStatus": "safe",
  "moderationNote": "Reviewed manually"
}
```

Allowed moderation statuses:

```text
safe
blocked
```

Moderation records:

- moderator id
- moderation time
- note
- audit log entry

## Why Scanning Must Be Async

Virus scanning is slow and unreliable compared with normal API writes. Large files need streaming, scanners can be temporarily unavailable, and external APIs can take seconds or minutes. If scanning runs inside the upload request, users hit timeouts and API servers waste memory and bandwidth.

Async scanning lets the API save metadata quickly while workers handle slower security work with retries and controlled concurrency.

## How Large SaaS Apps Handle Uploads

Production SaaS upload systems usually follow this pattern:

- direct upload to private object storage
- metadata saved as pending
- scan job queued
- file unavailable until clean
- infected files quarantined or blocked
- moderators can review edge cases
- cleanup jobs handle stuck scans
- workers scale independently from API servers

## Production Knobs

```env
ATTACHMENT_SCAN_PROVIDER=clamav
ATTACHMENT_SCAN_WORKER_CONCURRENCY=2
ATTACHMENT_SCAN_JOB_ATTEMPTS=3
ATTACHMENT_SCAN_MAX_BYTES=26214400
ATTACHMENT_SCAN_CLEANUP_CRON=*/30 * * * *
ATTACHMENT_SCAN_STALE_MINUTES=60
```

Keep scan concurrency conservative. Scanning is CPU and IO heavy, and external providers may rate limit requests.
