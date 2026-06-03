import { Request, Response } from 'express';
import * as bahanBakuService from '../services/bahanBaku.service';
import { sendError } from '../utils/response';

export async function listBahanBaku(req: Request, res: Response) {
  try {
    const data = await bahanBakuService.listBahanBaku({
      q: req.query.q as string,
      kecamatan: req.query.kecamatan as string,
      category_id: req.query.category_id as string,
      availability: req.query.availability as string,
    });
    res.json(data);
  } catch (error) {
    console.error('Bahan baku API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getBahanBakuById(req: Request, res: Response) {
  try {
    const data = await bahanBakuService.getBahanBakuById(req.params.id);
    if (!data) return sendError(res, 'Not found', 404);
    res.json(data);
  } catch (error) {
    console.error('Bahan baku detail API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
