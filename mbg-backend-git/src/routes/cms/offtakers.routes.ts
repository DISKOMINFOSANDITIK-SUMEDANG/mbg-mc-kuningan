import { Router } from 'express';
import { withRoleAuth, withAllRolesAuth } from '../../middleware/auth';
import * as offtakersCtrl from '../../controllers/cms/offtakers.controller';

const withOfftakerManagementAuth = withRoleAuth('administrator', 'offtaker', 'dinas_pertanian');

const router = Router();

// Offtakers
router.get('/', withOfftakerManagementAuth, offtakersCtrl.listOfftakers);
router.get('/search', withOfftakerManagementAuth, offtakersCtrl.searchOfftakers);
router.get('/:id', withOfftakerManagementAuth, offtakersCtrl.getOfftakerById);
router.post('/', withOfftakerManagementAuth, offtakersCtrl.createOfftaker);
router.put('/:id', withOfftakerManagementAuth, offtakersCtrl.updateOfftaker);
router.delete('/:id', withOfftakerManagementAuth, offtakersCtrl.deleteOfftaker);

export default router;
