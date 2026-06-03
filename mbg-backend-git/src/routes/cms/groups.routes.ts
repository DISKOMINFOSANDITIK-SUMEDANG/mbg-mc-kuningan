import { Router } from 'express';
import { withAllRolesAuth } from '../../middleware/auth';
import * as groupsCtrl from '../../controllers/cms/groups.controller';

const router = Router();

// Groups
router.get('/', withAllRolesAuth, groupsCtrl.listGroups);
router.get('/:id', withAllRolesAuth, groupsCtrl.getGroupById);
router.post('/', withAllRolesAuth, groupsCtrl.createGroup);
router.put('/:id', withAllRolesAuth, groupsCtrl.updateGroup);
router.delete('/:id', withAllRolesAuth, groupsCtrl.deleteGroup);

export default router;
