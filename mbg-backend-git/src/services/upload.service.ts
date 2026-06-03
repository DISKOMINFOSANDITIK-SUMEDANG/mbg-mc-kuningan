import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { config } from '../config';
import { uploadToS3, deleteFromS3, listFromS3 } from '../lib/s3';

const BUCKET = config.s3.bucket;
const PREFIX = config.s3.bucketPrefix;

function sanitizeFolder(folder: string): string {
  return folder.replace(/\.\./g, '').replace(/[^a-zA-Z0-9_\-\/]/g, '');
}

function prefixKey(key: string): string {
  return PREFIX ? `${PREFIX}/${key}` : key;
}

export async function uploadFile(file: Express.Multer.File, folder: string) {
  const safeFolder = sanitizeFolder(folder);
  const ext = path.extname(file.originalname);
  const fileName = `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;
  const key = prefixKey(`${safeFolder}/${fileName}`);

  const result = await uploadToS3(BUCKET, key, file.buffer, file.mimetype);
  return { url: result.url, path: result.path };
}

export async function listFiles(folder: string) {
  const safeFolder = sanitizeFolder(folder);
  return listFromS3(BUCKET, prefixKey(safeFolder));
}

export async function deleteFile(folder: string, fileName: string) {
  const safeFolder = sanitizeFolder(folder);
  const safeName = path.basename(fileName);
  const key = prefixKey(`${safeFolder}/${safeName}`);
  await deleteFromS3(BUCKET, key);
}
