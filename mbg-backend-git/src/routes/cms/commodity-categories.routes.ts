import { Router } from 'express';
import { withRoleAuth } from '../../middleware/auth';
import * as commoditiesCtrl from '../../controllers/cms/commodities.controller';

const withCommodityAuth = withRoleAuth('administrator', 'pemasok', 'dinas_pertanian');

const router = Router();

// Commodity Categories
router.get('/', withCommodityAuth, commoditiesCtrl.listCommodityCategories);
router.get('/:id', withCommodityAuth, commoditiesCtrl.getCommodityCategoryById);
router.post('/', withCommodityAuth, commoditiesCtrl.createCommodityCategory);
router.put('/:id', withCommodityAuth, commoditiesCtrl.updateCommodityCategory);
router.delete('/:id', withCommodityAuth, commoditiesCtrl.deleteCommodityCategory);

export default router;
