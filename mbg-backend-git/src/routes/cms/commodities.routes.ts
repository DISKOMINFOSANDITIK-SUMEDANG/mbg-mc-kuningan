import { Router } from 'express';
import { withRoleAuth } from '../../middleware/auth';
import * as commoditiesCtrl from '../../controllers/cms/commodities.controller';

const withCommodityAuth = withRoleAuth('administrator', 'pemasok', 'dinas_pertanian');

const router = Router();

// Commodities
router.get('/', withCommodityAuth, commoditiesCtrl.listCommodities);
router.get('/:id', withCommodityAuth, commoditiesCtrl.getCommodityById);
router.post('/', withCommodityAuth, commoditiesCtrl.createCommodity);
router.put('/:id', withCommodityAuth, commoditiesCtrl.updateCommodity);
router.delete('/:id', withCommodityAuth, commoditiesCtrl.deleteCommodity);

export default router;
