import { Router } from 'express';
import { withRoleAuth, withAdminAuth } from '../../middleware/auth';
import * as transactionsCtrl from '../../controllers/cms/transactions.controller';

const withOfftakerSalesAuth = withRoleAuth('administrator', 'offtaker');
const withTransactionAuth = withRoleAuth('administrator', 'pemasok', 'offtaker');

const withAllRolesAuth = withRoleAuth('administrator', 'pemasok', 'offtaker', 'sppg');

const router = Router();

// Unified Transactions (all roles)
router.get('/', withAllRolesAuth, transactionsCtrl.getUnifiedTransactions);
router.post('/', withAllRolesAuth, transactionsCtrl.createUnifiedTransaction);

// Offtaker Sales
router.get('/offtaker-sales', withOfftakerSalesAuth, transactionsCtrl.listOfftakerSales);
router.get('/offtaker-sales/:id', withOfftakerSalesAuth, transactionsCtrl.getOfftakerSaleById);
router.post('/offtaker-sales', withOfftakerSalesAuth, transactionsCtrl.createOfftakerSale);

// Sales Transactions (supplier + offtaker combined)
router.get('/sales', withTransactionAuth, transactionsCtrl.listSalesTransactions);
router.get('/sales/:id', withTransactionAuth, transactionsCtrl.getSalesTransactionById);
router.post('/sales', withTransactionAuth, transactionsCtrl.createSalesTransaction);
router.put('/sales/:id', withTransactionAuth, transactionsCtrl.updateSalesTransaction);
router.delete('/sales/:id', withTransactionAuth, transactionsCtrl.deleteSalesTransaction);

// Offtaker Purchases
router.get('/offtaker-purchases', withOfftakerSalesAuth, transactionsCtrl.listOfftakerPurchases);
router.post('/offtaker-purchases', withOfftakerSalesAuth, transactionsCtrl.createOfftakerPurchase);

// Additional Costs
router.get('/additional-costs', withTransactionAuth, transactionsCtrl.listAdditionalCosts);
router.post('/additional-costs', withTransactionAuth, transactionsCtrl.createAdditionalCost);
router.put('/additional-costs/:id', withTransactionAuth, transactionsCtrl.updateAdditionalCost);
router.delete('/additional-costs/:id', withTransactionAuth, transactionsCtrl.deleteAdditionalCost);

// Additional Cost Types
router.get('/additional-cost-types', withTransactionAuth, transactionsCtrl.listAdditionalCostTypes);
router.get('/additional-cost-types/:id', withTransactionAuth, transactionsCtrl.getAdditionalCostTypeById);
router.post('/additional-cost-types', withAdminAuth, transactionsCtrl.createAdditionalCostType);
router.put('/additional-cost-types/:id', withAdminAuth, transactionsCtrl.updateAdditionalCostType);
router.delete('/additional-cost-types/:id', withAdminAuth, transactionsCtrl.deleteAdditionalCostType);

export default router;
