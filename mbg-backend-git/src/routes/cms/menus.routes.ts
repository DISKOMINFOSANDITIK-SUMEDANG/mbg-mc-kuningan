import { Router } from 'express';
import { withAllRolesAuth } from '../../middleware/auth';
import * as menusCtrl from '../../controllers/cms/menus.controller';

const router = Router();

// Menu Items (must be before /:id to avoid conflicts)
router.get('/items', withAllRolesAuth, menusCtrl.listMenuItems);
router.get('/items/:id', withAllRolesAuth, menusCtrl.getMenuItemById);
router.post('/items', withAllRolesAuth, menusCtrl.createMenuItem);
router.put('/items/:id', withAllRolesAuth, menusCtrl.updateMenuItem);
router.delete('/items/:id', withAllRolesAuth, menusCtrl.deleteMenuItem);

// Menus
router.get('/', withAllRolesAuth, menusCtrl.listMenus);
router.get('/:id', withAllRolesAuth, menusCtrl.getMenuById);
router.post('/', withAllRolesAuth, menusCtrl.createMenu);
router.put('/:id', withAllRolesAuth, menusCtrl.updateMenu);
router.delete('/:id', withAllRolesAuth, menusCtrl.deleteMenu);

export default router;
