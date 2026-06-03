import { Router } from 'express';
import * as ctrl from '../controllers/schools.controller';

const router = Router();

router.get('/', ctrl.listSchools);
router.get('/:id', ctrl.getSchoolById);
router.get('/:id/reports', ctrl.getSchoolReports);

export default router;
