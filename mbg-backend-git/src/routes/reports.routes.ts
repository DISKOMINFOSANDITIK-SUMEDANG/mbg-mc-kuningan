import { Router } from 'express';
import * as reportsController from '../controllers/reports.controller';

const router = Router();

router.get('/school-reports', reportsController.getSchoolReports);
router.get('/school-reports-recap', reportsController.getSchoolReportsRecap);
router.get('/export-schools-report', reportsController.exportSchoolsReport);
router.get('/sppg-distribution-details', reportsController.getSppgDistributionDetails);
router.get('/sppg-distribution-recap', reportsController.getSppgDistributionRecap);
router.get('/sppg-distributions-recap', reportsController.getSppgDistributionsRecap);
router.get('/sppg-distributions-subtab', reportsController.getSppgDistributionsSubtab);

export default router;
