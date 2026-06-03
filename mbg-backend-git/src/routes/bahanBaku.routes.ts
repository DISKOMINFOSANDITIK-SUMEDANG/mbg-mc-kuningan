import { Router } from 'express';
import * as bahanBakuController from '../controllers/bahanBaku.controller';

const router = Router();

router.get('/', bahanBakuController.listBahanBaku);
router.get('/:id', bahanBakuController.getBahanBakuById);

export default router;
