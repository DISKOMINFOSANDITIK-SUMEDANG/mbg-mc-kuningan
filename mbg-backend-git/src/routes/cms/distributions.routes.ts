import { Router } from 'express';
import { withAllRolesAuth } from '../../middleware/auth';
import * as distributionsCtrl from '../../controllers/cms/distributions.controller';

const router = Router();

router.get('/', withAllRolesAuth, distributionsCtrl.listDistributions);
router.get('/grouped', withAllRolesAuth, distributionsCtrl.getGroupedDistributions);
router.get('/group', withAllRolesAuth, distributionsCtrl.getGroupedDistributions);
router.get('/last-portions', withAllRolesAuth, distributionsCtrl.getLastPortions);
router.post('/bulk', withAllRolesAuth, distributionsCtrl.createBulkDistributions);
router.delete('/grouped', withAllRolesAuth, distributionsCtrl.deleteGroupedDistributions);
router.delete('/group', withAllRolesAuth, distributionsCtrl.deleteGroupedDistributions);
router.get('/:id', withAllRolesAuth, distributionsCtrl.getDistributionById);
router.post('/', withAllRolesAuth, distributionsCtrl.createDistribution);
router.put('/:id', withAllRolesAuth, distributionsCtrl.updateDistribution);
router.delete('/:id', withAllRolesAuth, distributionsCtrl.deleteDistribution);

export default router;
