import { Router } from 'express';
import { withOfftakerAuth } from '../middleware/auth';
import * as offtakerController from '../controllers/offtaker.controller';

const router = Router();

router.get('/requests', withOfftakerAuth, offtakerController.getRequests);
router.get('/requests/:id', withOfftakerAuth, offtakerController.getRequestById);
router.put('/requests/:id', withOfftakerAuth, offtakerController.updateRequest);

export default router;
