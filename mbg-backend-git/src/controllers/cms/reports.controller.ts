import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as reportsService from '../../services/cms/reports.service';
import { sendError } from '../../utils/response';

export async function exportSalesExcel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const query = { ...req.query, ...req.body } as Record<string, any>;
    await reportsService.exportSalesExcel(query, res);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
