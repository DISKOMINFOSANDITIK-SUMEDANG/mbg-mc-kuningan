import { Router } from 'express';
import { withAllRolesAuth } from '../../middleware/auth';
import * as schoolsCtrl from '../../controllers/cms/schools.controller';

const router = Router();

router.get('/', withAllRolesAuth, schoolsCtrl.listSchools);
router.get('/search', withAllRolesAuth, schoolsCtrl.searchSchools);
router.get('/:id', withAllRolesAuth, schoolsCtrl.getSchoolById);
router.post('/', withAllRolesAuth, schoolsCtrl.createSchool);
router.put('/:id', withAllRolesAuth, schoolsCtrl.updateSchool);
router.delete('/:id', withAllRolesAuth, schoolsCtrl.deleteSchool);

export default router;
