# ClubFlow Secure Attachments

ClubFlow now supports private object storage for task attachments using S3-compatible signed URLs.

## Upload Flow

```text
Frontend -> Backend: request signed upload URL
Backend -> S3: creates presigned PUT URL
Frontend -> S3: direct upload with signed URL
Frontend -> Backend: save uploaded object metadata
Backend -> S3: HEAD object validation
Backend -> MongoDB: save attachment metadata
```

Routes:

```text
POST /api/tasks/:taskId/attachments/signed-upload
POST /api/tasks/:taskId/attachments/complete
GET  /api/tasks/:taskId/attachments/:attachmentId/download
```

The existing multipart upload route still works for backward compatibility:

```text
POST /api/tasks/:taskId/attachments
```

## Backend Services

Storage service:

```text
backend/services/objectStorage.service.js
```

It handles:

- S3 client creation
- file type and size validation
- private object key generation
- presigned upload URLs
- presigned download URLs
- object metadata checks
- storage key scope validation

## Metadata Structure

Task attachments now support:

```js
{
  filename: String,
  url: String,
  storageProvider: 'cloudinary' | 's3',
  storageKey: String,
  bucket: String,
  visibility: 'public' | 'private',
  checksum: String,
  fileType: String,
  fileSize: Number,
  uploadedBy: ObjectId,
  uploadedAt: Date
}
```

Private S3 objects do not store a permanent public URL. They store `storageKey` and receive temporary download URLs on demand.

## Signed Upload URL Request

Request:

```json
{
  "filename": "proposal.pdf",
  "contentType": "application/pdf",
  "fileSize": 381204
}
```

Response:

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "method": "PUT",
    "storageProvider": "s3",
    "storageKey": "private/clubs/.../tasks/.../attachments/...",
    "bucket": "clubflow-private",
    "expiresIn": 900,
    "headers": {
      "Content-Type": "application/pdf",
      "x-amz-server-side-encryption": "AES256"
    }
  }
}
```

The frontend must upload the file directly to `uploadUrl` using `PUT` and the returned headers.

## Complete Upload Request

After direct upload:

```json
{
  "filename": "proposal.pdf",
  "contentType": "application/pdf",
  "fileSize": 381204,
  "storageKey": "private/clubs/.../tasks/.../attachments/...",
  "checksum": "optional-client-checksum"
}
```

The backend validates:

- user can attach to the task
- content type is allowed
- file size is within limit
- storage key belongs to that task and club
- object exists in S3
- uploaded object size and content type match metadata

## Download Flow

```text
Frontend -> Backend: request download URL
Backend -> MongoDB: load task and attachment
Backend -> Permissions: validate task view access
Backend -> S3: create temporary GET URL
Frontend -> S3: download directly
```

Private download URLs expire quickly:

```env
SIGNED_DOWNLOAD_URL_TTL_SECONDS=300
```

## Permissions

Upload URL creation uses task `comment` permission, matching the existing attachment behavior.

Download URL creation uses task `view` permission.

Object keys are scoped by:

```text
private/clubs/<clubId>/tasks/<taskId>/attachments/<userId>/...
```

The complete-upload endpoint rejects keys outside the expected club/task prefix, preventing a user from saving arbitrary S3 objects as task attachments.

## Validation

Defaults:

```env
ATTACHMENT_MAX_BYTES=10485760
ATTACHMENT_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## Required Environment

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=clubflow-private

SIGNED_UPLOAD_URL_TTL_SECONDS=900
SIGNED_DOWNLOAD_URL_TTL_SECONDS=300
S3_SERVER_SIDE_ENCRYPTION=AES256
```

For S3-compatible providers:

```env
S3_ENDPOINT=https://...
S3_FORCE_PATH_STYLE=true
```

## Why Direct Uploads Scale

Direct uploads keep large file bytes out of the API server. The API only signs the upload and saves metadata. S3 receives the file directly, which reduces API bandwidth, memory pressure, request timeouts, and horizontal scaling cost.

## How Signed URLs Work

A signed URL grants temporary permission for one specific object operation, such as `PUT private/.../file.pdf` or `GET private/.../file.pdf`. The backend signs the URL with AWS credentials, but the frontend never receives those credentials.

## Preventing Unauthorized Access

- Keep the bucket private.
- Never store permanent public URLs for private files.
- Generate download URLs only after checking task permissions.
- Use short download URL TTLs.
- Scope object keys by club and task.
- Validate object metadata after upload.
- Restrict allowed MIME types and file sizes.
- Use least-privilege IAM: allow only required `s3:PutObject`, `s3:GetObject`, and `s3:HeadObject` paths.
