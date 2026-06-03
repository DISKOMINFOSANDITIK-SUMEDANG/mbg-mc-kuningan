import { Router } from 'express';
import * as distributionsController from '../controllers/distributions.controller';

const router = Router();

router.get('/distributions', distributionsController.listDistributions);

export default router;
