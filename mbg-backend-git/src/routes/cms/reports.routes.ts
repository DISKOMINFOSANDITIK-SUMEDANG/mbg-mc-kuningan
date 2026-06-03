import { Router } from 'express';
import { withAllRolesAuth } from '../../middleware/auth';
import * as reportsCtrl from '../../controllers/cms/reports.controller';

const router = Router();

router.get('/sales/export-excel', withAllRolesAuth, reportsCtrl.exportSalesExcel);
router.post('/sales/export-excel', withAllRolesAuth, reportsCtrl.exportSalesExcel);

export default router;
