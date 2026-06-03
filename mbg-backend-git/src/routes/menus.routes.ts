import { Router } from 'express';
import * as menusController from '../controllers/menus.controller';

const router = Router();

router.get('/menus', menusController.listMenus);
router.get('/menu-items', menusController.listMenuItems);

export default router;
