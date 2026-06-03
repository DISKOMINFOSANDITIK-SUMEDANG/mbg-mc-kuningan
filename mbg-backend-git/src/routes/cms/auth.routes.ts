import { Router } from 'express';
import { withAllRolesAuth } from '../../middleware/auth';
import * as authCtrl from '../../controllers/cms/auth.controller';

const router = Router();

router.get('/me', withAllRolesAuth, authCtrl.getMe);
router.put('/account', withAllRolesAuth, authCtrl.updateAccount);
router.get('/profile', withAllRolesAuth, authCtrl.getProfile);
router.put('/profile', withAllRolesAuth, authCtrl.updateProfile);
router.get('/offtaker-profile', withAllRolesAuth, authCtrl.getOfftakerProfile);
router.put('/offtaker-profile', withAllRolesAuth, authCtrl.updateOfftakerProfile);

export default router;
