import { Router } from 'express';
import { uploadMemory as memoryUpload } from '../middleware/upload';
import { withAuth } from '../middleware/auth';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

router.post('/', withAuth, memoryUpload.single('file'), uploadController.uploadFile);
router.post('/upload', withAuth, memoryUpload.single('file'), uploadController.uploadFile);
router.get('/files', withAuth, uploadController.listFiles);
router.delete('/files', withAuth, uploadController.deleteFile);

export default router;
