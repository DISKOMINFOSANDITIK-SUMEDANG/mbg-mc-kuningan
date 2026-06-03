import { Router } from 'express';
import { withRoleAuth, withAllRolesAuth } from '../../middleware/auth';
import * as stockCtrl from '../../controllers/cms/stock.controller';

const withStockAuth = withRoleAuth('administrator', 'pemasok', 'dinas_pertanian');
const withSppgAuth = withRoleAuth('administrator', 'sppg');

const router = Router();

// Stock Movements
router.get('/movements', withStockAuth, stockCtrl.listStockMovements);
router.get('/movements/:id', withStockAuth, stockCtrl.getStockMovementById);
router.post('/movements', withStockAuth, stockCtrl.createStockMovement);
router.put('/movements/:id', withStockAuth, stockCtrl.updateStockMovement);
router.delete('/movements/:id', withStockAuth, stockCtrl.deleteStockMovement);
router.post('/movements/auto-expire', stockCtrl.autoExpireStocks);

// Product Requests
router.get('/product-requests', withAllRolesAuth, stockCtrl.listProductRequests);
router.get('/product-requests/:id', withAllRolesAuth, stockCtrl.getProductRequestById);
router.put('/product-requests/:id', withAllRolesAuth, stockCtrl.updateProductRequestStatus);

// Served Entities (SPPG only)
router.get('/served-entities', withSppgAuth, stockCtrl.getServedEntities);
router.post('/served-entities/schools', withSppgAuth, stockCtrl.assignSchoolToSppg);
router.delete('/served-entities/schools', withSppgAuth, stockCtrl.removeSchoolFromSppg);
router.get('/served-entities/schools/search', withSppgAuth, stockCtrl.searchSchoolsForSppg);

// Available Products (SPPG view)
router.get('/available-products', withSppgAuth, stockCtrl.getAvailableProducts);

// Products (admin/offtaker/dinas view of supplier products)
router.get('/products', withRoleAuth('administrator', 'offtaker', 'dinas_pertanian'), stockCtrl.listProducts);

// User entity lookups
router.get('/offtaker-users/by-user', withAllRolesAuth, stockCtrl.getOfftakerUserByUserId);
router.get('/supplier-users/by-user', withAllRolesAuth, stockCtrl.getSupplierUserByUserId);

export default router;
