import { Router } from 'express';
import { withAllRolesAuth } from '../../middleware/auth';
import * as groupsCtrl from '../../controllers/cms/groups.controller';

const router = Router();

// Foundations
router.get('/', withAllRolesAuth, groupsCtrl.listFoundations);
router.get('/:id', withAllRolesAuth, groupsCtrl.getFoundationById);
router.post('/', withAllRolesAuth, groupsCtrl.createFoundation);
router.put('/:id', withAllRolesAuth, groupsCtrl.updateFoundation);
router.delete('/:id', withAllRolesAuth, groupsCtrl.deleteFoundation);

export default router;
