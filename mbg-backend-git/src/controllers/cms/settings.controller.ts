import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as settingsService from '../../services/cms/settings.service';
import { sendSuccess, sendError } from '../../utils/response';

export async function getBeneficiaryTargets(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await settingsService.getBeneficiaryTargets();
    return sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function updateBeneficiaryTargets(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body;
    const fields = [
      'total_realized', 'total_target',
      'pesantren_realized', 'pesantren_total',
      'santri_realized', 'santri_target',
      'sekolah_realized', 'sekolah_total',
      'siswa_realized', 'siswa_target',
      'ibu_balita_realized', 'ibu_balita_target',
      'bumil_realized', 'bumil_target',
      'busui_realized', 'busui_target',
      'balita_realized', 'balita_target',
    ];

    for (const field of fields) {
      if (body[field] === undefined || body[field] === null) {
        return sendError(res, `Field '${field}' is required`, 400);
      }
      const num = Number(body[field]);
      if (isNaN(num) || num < 0) {
        return sendError(res, `Field '${field}' must be a non-negative number`, 400);
      }
    }

    const data = {
      total_realized: Number(body.total_realized),
      total_target: Number(body.total_target),
      pesantren_realized: Number(body.pesantren_realized),
      pesantren_total: Number(body.pesantren_total),
      santri_realized: Number(body.santri_realized),
      santri_target: Number(body.santri_target),
      sekolah_realized: Number(body.sekolah_realized),
      sekolah_total: Number(body.sekolah_total),
      siswa_realized: Number(body.siswa_realized),
      siswa_target: Number(body.siswa_target),
      ibu_balita_realized: Number(body.ibu_balita_realized),
      ibu_balita_target: Number(body.ibu_balita_target),
      bumil_realized: Number(body.bumil_realized),
      bumil_target: Number(body.bumil_target),
      busui_realized: Number(body.busui_realized),
      busui_target: Number(body.busui_target),
      balita_realized: Number(body.balita_realized),
      balita_target: Number(body.balita_target),
    };

    const updated = await settingsService.updateBeneficiaryTargets(data);
    return sendSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}
