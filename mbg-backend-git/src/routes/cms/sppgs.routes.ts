import { Router } from 'express';
import { withAllRolesAuth } from '../../middleware/auth';
import * as sppgsCtrl from '../../controllers/cms/sppgs.controller';

const router = Router();

// SPPG CRUD
router.get('/', withAllRolesAuth, sppgsCtrl.listSppgs);
router.get('/search', withAllRolesAuth, sppgsCtrl.searchSppgs);
router.get('/options', withAllRolesAuth, sppgsCtrl.getSppgOptions);
router.get('/:id', withAllRolesAuth, sppgsCtrl.getSppgById);
router.post('/', withAllRolesAuth, sppgsCtrl.createSppg);
router.put('/:id', withAllRolesAuth, sppgsCtrl.updateSppg);
router.delete('/:id', withAllRolesAuth, sppgsCtrl.deleteSppg);

// Nutritionist
router.get('/:sppgId/nutritionist', withAllRolesAuth, sppgsCtrl.getNutritionist);
router.post('/:sppgId/nutritionist', withAllRolesAuth, sppgsCtrl.createNutritionist);
router.put('/:sppgId/nutritionist', withAllRolesAuth, sppgsCtrl.updateNutritionist);
router.delete('/:sppgId/nutritionist', withAllRolesAuth, sppgsCtrl.deleteNutritionist);

// Facilities
router.get('/:sppgId/facilities', withAllRolesAuth, sppgsCtrl.getFacilities);
router.post('/:sppgId/facilities', withAllRolesAuth, sppgsCtrl.createFacility);
router.put('/:sppgId/facilities/:facilityId', withAllRolesAuth, sppgsCtrl.updateFacility);
router.delete('/:sppgId/facilities/:facilityId', withAllRolesAuth, sppgsCtrl.deleteFacility);

// Kitchen Photos
router.get('/:sppgId/kitchen-photos', withAllRolesAuth, sppgsCtrl.getKitchenPhotos);
router.post('/:sppgId/kitchen-photos', withAllRolesAuth, sppgsCtrl.createKitchenPhoto);
router.put('/:sppgId/kitchen-photos/batch', withAllRolesAuth, sppgsCtrl.updateKitchenPhotos);
router.put('/:sppgId/kitchen-photos/:photoId', withAllRolesAuth, sppgsCtrl.updateKitchenPhoto);
router.delete('/:sppgId/kitchen-photos/:photoId', withAllRolesAuth, sppgsCtrl.deleteKitchenPhoto);

// SLHS Certificate
router.get('/:sppgId/slhs-certificate', withAllRolesAuth, sppgsCtrl.getSlhsCertificate);
router.post('/:sppgId/slhs-certificate', withAllRolesAuth, sppgsCtrl.createSlhsCertificate);
router.put('/:sppgId/slhs-certificate', withAllRolesAuth, sppgsCtrl.updateSlhsCertificate);

// Schools
router.get('/:sppgId/schools', withAllRolesAuth, sppgsCtrl.getSppgSchools);

export default router;
