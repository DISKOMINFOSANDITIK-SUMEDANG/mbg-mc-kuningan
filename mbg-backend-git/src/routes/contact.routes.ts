import { Router } from 'express';
import { contactRateLimiter } from '../middleware/rateLimiter';
import * as contactController from '../controllers/contact.controller';

const router = Router();

router.post('/', contactRateLimiter, contactController.submitContact);
router.get('/sppg-options', contactController.getSppgOptions);
router.get('/school-options', contactController.getSchoolOptions);

export default router;
