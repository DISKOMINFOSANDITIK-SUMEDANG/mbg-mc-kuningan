import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as distributionsService from '../../services/cms/distributions.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export async function listDistributions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', sppg_id, date, recipient_type } = req.query as Record<string, string>;
    const sppgId = req.user!.role === 'sppg' ? req.user!.sppgId : sppg_id;
    const result = await distributionsService.listDistributions({
      page: parseInt(page), limit: parseInt(limit), sppg_id: sppgId, date, recipient_type
    });
    return sendPaginated(res, result.distributions, result.total, result.page, result.limit);
  } catch (err) { next(err); }
}

export async function getDistributionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await distributionsService.getDistributionById(req.params.id);
    if (!data) return sendError(res, 'Distribution not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createDistribution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sppgId = req.user!.sppgId || req.body.sppg_id;
    const data = await distributionsService.createDistribution({ ...req.body, sppg_id: sppgId });
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateDistribution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await distributionsService.updateDistribution(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteDistribution(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await distributionsService.deleteDistribution(req.params.id);
    return sendSuccess(res, { message: 'Distribution deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function getGroupedDistributions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { sppg_id } = req.query as Record<string, string>;
    const sppgId = req.user!.role === 'sppg' ? req.user!.sppgId : sppg_id;
    const data = await distributionsService.getGroupedDistributions(sppgId!);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function deleteGroupedDistributions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Support both query params (DELETE with URL params) and body
    const sppg_id = (req.query.sppg_id as string) || req.body.sppg_id;
    const date = (req.query.date as string) || req.body.date;
    const menu_id = (req.query.menu_id as string) || req.body.menu_id;
    const sppgId = req.user!.sppgId || sppg_id;
    await distributionsService.deleteGroupedDistributions(sppgId, date, menu_id);
    return sendSuccess(res, { message: 'Grouped distributions deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function createBulkDistributions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sppgId = req.user!.sppgId || req.body.sppg_id;
    const { distribution_date, menu_id, notes, recipients, distributions } = req.body;

    // Support both formats:
    // 1. { distributions: [...] } — array of full distribution objects
    // 2. { sppg_id, distribution_date, menu_id, notes, recipients: [...] } — form payload
    let distArray = distributions;
    if (!distArray && Array.isArray(recipients)) {
      distArray = recipients.map((r: any) => ({
        sppg_id: sppgId,
        distribution_date,
        menu_id,
        recipient_type: r.recipient_type,
        recipient_id: r.recipient_id,
        portions: r.portions,
        notes,
      }));
    }

    const data = await distributionsService.createBulkDistributions({ distributions: distArray }, sppgId);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function getLastPortions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sppgId = req.user!.role === 'sppg' ? req.user!.sppgId : (req.query.sppg_id as string);
    if (!sppgId) return sendError(res, 'sppg_id is required', 400);
    const data = await distributionsService.getLastPortionsBySppg(sppgId);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}
