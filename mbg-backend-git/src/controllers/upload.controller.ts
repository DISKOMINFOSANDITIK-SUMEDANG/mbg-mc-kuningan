import { Request, Response } from 'express';
import * as uploadService from '../services/upload.service';
import { sendError } from '../utils/response';
import { presignUrl } from '../lib/s3';
import { config } from '../config';

export async function uploadFile(req: Request, res: Response) {
  try {
    const file = req.file;
    const folder = req.body.folder as string;

    if (!file) return sendError(res, 'No file provided', 400);
    if (!folder) return sendError(res, 'No folder provided', 400);

    const result = await uploadService.uploadFile(file, folder);
    res.json({ success: true, url: result.url, path: result.path });
  } catch (error: any) {
    console.error('Upload API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function listFiles(req: Request, res: Response) {
  try {
    const folder = req.query.folder as string;
    if (!folder) return sendError(res, 'Folder parameter required', 400);

    const data = await uploadService.listFiles(folder);

    // Generate presigned URLs for each file
    const bucket = config.s3.bucket;
    const prefix = config.s3.bucketPrefix;
    const filesWithUrls = await Promise.all(
      data.map(async (file: any) => {
        const key = prefix ? `${prefix}/${folder}/${file.name}` : `${folder}/${file.name}`;
        const publicUrl = config.s3.publicUrl
          ? `${config.s3.publicUrl}/${bucket}/${key}`
          : `${config.s3.endpoint}/${bucket}/${key}`;
        const url = await presignUrl(publicUrl);
        return { ...file, url };
      })
    );

    res.json(filesWithUrls);
  } catch (error) {
    console.error('Files GET API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function deleteFile(req: Request, res: Response) {
  try {
    const { folder, fileName } = req.body;
    if (!folder || !fileName) return sendError(res, 'Folder and fileName required', 400);

    await uploadService.deleteFile(folder, fileName);
    res.json({ success: true });
  } catch (error) {
    console.error('Files DELETE API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
