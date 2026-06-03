import { Router } from 'express';
import { withAdminAuth } from '../../middleware/auth';
import * as settingsController from '../../controllers/cms/settings.controller';

const router = Router();

router.get('/beneficiary-targets', withAdminAuth, settingsController.getBeneficiaryTargets);
router.put('/beneficiary-targets', withAdminAuth, settingsController.updateBeneficiaryTargets);

export default router;
