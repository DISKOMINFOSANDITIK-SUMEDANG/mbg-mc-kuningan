import { Router } from 'express';
import { withRoleAuth } from '../../middleware/auth';
import * as suppliersCtrl from '../../controllers/cms/suppliers.controller';

const withSupplierAuth = withRoleAuth('administrator', 'pemasok', 'dinas_pertanian');

const router = Router();

// Suppliers
router.get('/', withSupplierAuth, suppliersCtrl.listSuppliers);
router.get('/search', withSupplierAuth, suppliersCtrl.searchSuppliers);
router.get('/:id', withSupplierAuth, suppliersCtrl.getSupplierById);
router.post('/', withSupplierAuth, suppliersCtrl.createSupplier);
router.put('/:id', withSupplierAuth, suppliersCtrl.updateSupplier);
router.delete('/:id', withSupplierAuth, suppliersCtrl.deleteSupplier);

export default router;
