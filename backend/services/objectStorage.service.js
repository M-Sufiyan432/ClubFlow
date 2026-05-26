const crypto = require('crypto');
const path = require('path');
const {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const getBucketName = () => {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is required for private attachment storage');
  }

  return process.env.S3_BUCKET_NAME;
};

const getS3Client = () => new S3Client({
  region: process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    : undefined
});

const getAllowedMimeTypes = () => {
  if (!process.env.ATTACHMENT_ALLOWED_MIME_TYPES) return DEFAULT_ALLOWED_MIME_TYPES;

  return process.env.ATTACHMENT_ALLOWED_MIME_TYPES
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const getMaxFileSizeBytes = () => Number(process.env.ATTACHMENT_MAX_BYTES || 10 * 1024 * 1024);

const sanitizeFileName = (filename = 'attachment') => {
  const parsed = path.parse(filename);
  const safeName = parsed.name
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'attachment';
  const safeExt = parsed.ext.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 16);

  return `${safeName}${safeExt}`;
};

const validateAttachmentFile = ({ filename, contentType, fileSize }) => {
  const allowedMimeTypes = getAllowedMimeTypes();
  const maxFileSize = getMaxFileSizeBytes();

  if (!filename || typeof filename !== 'string') {
    throw new Error('A valid filename is required');
  }

  if (!allowedMimeTypes.includes(contentType)) {
    throw new Error(`File type ${contentType} is not allowed`);
  }

  if (!Number.isFinite(Number(fileSize)) || Number(fileSize) <= 0 || Number(fileSize) > maxFileSize) {
    throw new Error(`File size must be between 1 byte and ${maxFileSize} bytes`);
  }
};

const buildTaskAttachmentKey = ({ clubId, taskId, userId, filename }) => {
  const randomId = crypto.randomUUID();
  return [
    'private',
    'clubs',
    clubId.toString(),
    'tasks',
    taskId.toString(),
    'attachments',
    userId.toString(),
    `${Date.now()}-${randomId}-${sanitizeFileName(filename)}`
  ].join('/');
};

const assertTaskAttachmentKey = ({ key, clubId, taskId }) => {
  const expectedPrefix = `private/clubs/${clubId}/tasks/${taskId}/attachments/`;
  if (!key || typeof key !== 'string' || !key.startsWith(expectedPrefix)) {
    throw new Error('Invalid attachment storage key');
  }
};

const createSignedUploadUrl = async ({ key, contentType, fileSize, expiresInSeconds = 900 }) => {
  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: process.env.S3_SERVER_SIDE_ENCRYPTION || 'AES256',
    Metadata: {
      visibility: 'private',
      app: 'clubflow'
    }
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
};

const createSignedDownloadUrl = async ({ key, filename, expiresInSeconds = 300 }) => {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${sanitizeFileName(filename)}"`
  });

  return getSignedUrl(getS3Client(), command, { expiresIn: expiresInSeconds });
};

const getObjectMetadata = async (key) => {
  const command = new HeadObjectCommand({
    Bucket: getBucketName(),
    Key: key
  });

  return getS3Client().send(command);
};

const getObjectStream = async (key) => {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key
  });

  const response = await getS3Client().send(command);
  return response.Body;
};

module.exports = {
  assertTaskAttachmentKey,
  buildTaskAttachmentKey,
  createSignedDownloadUrl,
  createSignedUploadUrl,
  getAllowedMimeTypes,
  getMaxFileSizeBytes,
  getObjectMetadata,
  getObjectStream,
  sanitizeFileName,
  validateAttachmentFile
};
