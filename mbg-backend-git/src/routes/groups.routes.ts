import { Router } from 'express';
import * as groupsController from '../controllers/groups.controller';

const router = Router();

router.get('/', groupsController.listGroups);
router.get('/:id', groupsController.getGroupById);
router.get('/:id/sppgs', groupsController.getGroupSppgs);

export default router;
