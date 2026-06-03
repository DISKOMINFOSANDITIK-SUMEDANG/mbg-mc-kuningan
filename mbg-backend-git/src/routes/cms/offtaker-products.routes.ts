import { Router } from 'express';
import { withRoleAuth } from '../../middleware/auth';
import * as offtakersCtrl from '../../controllers/cms/offtakers.controller';

const withOfftakerManagementAuth = withRoleAuth('administrator', 'offtaker', 'dinas_pertanian');

const router = Router();

// Offtaker Products
router.get('/', withOfftakerManagementAuth, offtakersCtrl.listOfftakerProducts);
router.get('/:id', withOfftakerManagementAuth, offtakersCtrl.getOfftakerProductById);
router.post('/', withOfftakerManagementAuth, offtakersCtrl.createOfftakerProduct);
router.put('/:id', withOfftakerManagementAuth, offtakersCtrl.updateOfftakerProduct);
router.delete('/:id', withOfftakerManagementAuth, offtakersCtrl.deleteOfftakerProduct);

export default router;
