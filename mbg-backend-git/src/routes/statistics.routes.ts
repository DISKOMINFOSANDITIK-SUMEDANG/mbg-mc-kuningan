import { Router } from 'express';
import * as statisticsController from '../controllers/statistics.controller';

const router = Router();

router.get('/statistics', statisticsController.getStatistics);
router.get('/school-statistics', statisticsController.getSchoolStatistics);
router.get('/beneficiary-targets', statisticsController.getBeneficiaryTargets);

export default router;
