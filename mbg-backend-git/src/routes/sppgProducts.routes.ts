import { Router } from 'express';
import { withRoleAuth, withSppgAuth } from '../middleware/auth';
import * as sppgProductsController from '../controllers/sppgProducts.controller';

const router = Router();

router.get('/products', withRoleAuth('administrator', 'sppg', 'dinas_pertanian'), sppgProductsController.getProducts);
router.get('/supplier-products', withRoleAuth('administrator', 'sppg', 'dinas_pertanian'), sppgProductsController.getSupplierProducts);
router.get('/product-requests', withSppgAuth, sppgProductsController.getProductRequests);
router.post('/product-requests', withSppgAuth, sppgProductsController.createProductRequest);

export default router;
