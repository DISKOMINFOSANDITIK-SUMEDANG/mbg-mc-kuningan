import { Router } from 'express';
import * as ctrl from '../controllers/sppgs.controller';

const router = Router();

router.get('/', ctrl.listSppgs);
router.get('/:id', ctrl.getSppgById);
router.get('/:id/distributions', ctrl.getSppgDistributions);
router.get('/:id/kitchen-photos', ctrl.getSppgKitchenPhotos);
router.get('/:id/reports', ctrl.getSppgReports);
router.get('/:id/schools', ctrl.getSppgSchools);

export default router;
