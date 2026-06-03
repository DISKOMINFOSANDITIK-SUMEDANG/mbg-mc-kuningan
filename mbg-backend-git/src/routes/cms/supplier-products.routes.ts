import { Router } from 'express';
import { withRoleAuth } from '../../middleware/auth';
import * as suppliersCtrl from '../../controllers/cms/suppliers.controller';

const withSupplierAuth = withRoleAuth('administrator', 'pemasok', 'dinas_pertanian');

const router = Router();

// Supplier Products
router.get('/', withSupplierAuth, suppliersCtrl.listSupplierProducts);
router.get('/:id', withSupplierAuth, suppliersCtrl.getSupplierProductById);
router.post('/', withSupplierAuth, suppliersCtrl.createSupplierProduct);
router.put('/:id', withSupplierAuth, suppliersCtrl.updateSupplierProduct);
router.delete('/:id', withSupplierAuth, suppliersCtrl.deleteSupplierProduct);
router.post('/auto-expire', withSupplierAuth, suppliersCtrl.autoExpireProducts);

export default router;
