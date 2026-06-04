import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';

const s3Config = config.s3;

const s3 = new S3Client({
  endpoint: s3Config.endpoint || undefined,
  region: s3Config.region,
  credentials: {
    accessKeyId: s3Config.accessKey,
    secretAccessKey: s3Config.secretKey,
  },
  forcePathStyle: s3Config.forcePathStyle,
});

function getPublicUrl(bucket: string, key: string): string {
  if (s3Config.publicUrl) {
    return `${s3Config.publicUrl}/${bucket}/${key}`;
  }
  if (s3Config.endpoint) {
    return `${s3Config.endpoint}/${bucket}/${key}`;
  }
  return `https://${bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
}

export async function uploadToS3(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
  options?: { cacheControl?: string; upsert?: boolean }
): Promise<{ url: string; path: string }> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: options?.cacheControl || '3600',
    })
  );
  return { url: getPublicUrl(bucket, key), path: key };
}

export async function deleteFromS3(bucket: string, key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export async function deleteMultipleFromS3(bucket: string, keys: string[]): Promise<void> {
  for (const key of keys) {
    await deleteFromS3(bucket, key);
  }
}

export interface S3FileInfo {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  };
}

export async function listFromS3(
  bucket: string,
  prefix: string,
  limit = 100
): Promise<S3FileInfo[]> {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: normalizedPrefix,
      MaxKeys: limit,
    })
  );

  if (!result.Contents) return [];

  return result.Contents
    .filter((obj) => obj.Key && obj.Key !== normalizedPrefix)
    .map((obj) => {
      const fullKey = obj.Key!;
      const name = fullKey.substring(normalizedPrefix.length);
      return {
        name,
        id: name,
        updated_at: obj.LastModified?.toISOString() || '',
        created_at: obj.LastModified?.toISOString() || '',
        metadata: {
          size: obj.Size,
        },
      };
    });
}

export async function getFromS3(bucket: string, key: string): Promise<Buffer | null> {
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
    if (!result.Body) return null;
    const chunks: Uint8Array[] = [];
    for await (const chunk of result.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (err: any) {
    if (err.name === 'NoSuchKey') return null;
    throw err;
  }
}

export { s3 as s3Client };

/**
 * Convert a full S3 URL stored in the DB to a presigned URL.
 * Accepts URLs like https://s3.kuningankab.go.id/supabase-mbg/stub/mbg-reports/file.jpg
 * Returns a presigned URL valid for `expiresIn` seconds (default 1 hour).
 * If the URL doesn't match the expected pattern, returns it unchanged.
 */
export async function presignUrl(fullUrl: string, expiresIn = 3600): Promise<string> {
  if (!fullUrl) return fullUrl;

  const endpoint = s3Config.endpoint || s3Config.publicUrl;
  if (!endpoint) return fullUrl;

  // Try to extract bucket and key from the URL
  // Pattern: https://endpoint/bucket/key
  const prefix = `${endpoint}/`;
  if (!fullUrl.startsWith(prefix)) return fullUrl;

  const rest = fullUrl.slice(prefix.length);
  const slashIdx = rest.indexOf('/');
  if (slashIdx < 0) return fullUrl;

  const bucket = rest.slice(0, slashIdx);
  const key = rest.slice(slashIdx + 1);

  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}

/**
 * Presign all S3 URLs in an array of objects for the given fields.
 */
export async function presignFields<T extends Record<string, any>>(
  rows: T[],
  fields: (keyof T)[],
  expiresIn = 3600,
): Promise<T[]> {
  const promises = rows.map(async (row) => {
    const copy = { ...row };
    for (const field of fields) {
      if (typeof copy[field] === 'string' && copy[field]) {
        (copy as any)[field] = await presignUrl(copy[field] as string, expiresIn);
      }
    }
    return copy;
  });
  return Promise.all(promises);
}

/**
 * Normalize S3 URL values before storing into DB.
 * If the URL points to our configured S3 endpoint/public URL, remove query/hash
 * so we never persist temporary presigned tokens.
 */
export function normalizeS3UrlForStorage(rawUrl?: string | null): string | null {
  if (!rawUrl) return null;
  if (typeof rawUrl !== 'string') return null;

  const url = rawUrl.trim();
  if (!url) return null;

  const endpoint = s3Config.endpoint || s3Config.publicUrl;
  if (!endpoint || !url.startsWith(`${endpoint}/`)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    // Fallback: best-effort strip query/hash for endpoint-based URLs
    return url.split('?')[0].split('#')[0];
  }
}

export default { uploadToS3, deleteFromS3, deleteMultipleFromS3, listFromS3, getFromS3, presignUrl, presignFields, normalizeS3UrlForStorage };
