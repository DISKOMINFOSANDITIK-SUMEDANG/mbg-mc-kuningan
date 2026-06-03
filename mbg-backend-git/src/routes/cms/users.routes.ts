import { Router } from 'express';
import { withAllRolesAuth, withAdminAuth } from '../../middleware/auth';
import * as usersCtrl from '../../controllers/cms/users.controller';

const router = Router();

router.get('/', withAllRolesAuth, usersCtrl.listUsers);
router.get('/:id', withAllRolesAuth, usersCtrl.getUserById);
router.post('/', withAdminAuth, usersCtrl.createUser);
router.put('/:id', withAdminAuth, usersCtrl.updateUser);
router.delete('/:id/permanent', withAdminAuth, usersCtrl.permanentlyDeleteUser);
router.delete('/:id', withAdminAuth, usersCtrl.deleteUser);
router.post('/:id/reset-password', withAdminAuth, usersCtrl.resetUserPassword);

export default router;
