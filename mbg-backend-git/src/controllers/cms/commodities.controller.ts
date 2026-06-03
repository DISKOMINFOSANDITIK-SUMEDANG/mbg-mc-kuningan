import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as commoditiesService from '../../services/cms/commodities.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

// Commodities
export async function listCommodities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', q, category_id, status } = req.query as Record<string, string>;
    const result = await commoditiesService.listCommodities({
      page: parseInt(page), limit: parseInt(limit), q, category_id, status
    });
    return sendPaginated(res, result.commodities, result.total, result.page, result.limit);
  } catch (err) { next(err); }
}

export async function getCommodityById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await commoditiesService.getCommodityById(req.params.id);
    if (!data) return sendError(res, 'Commodity not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createCommodity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await commoditiesService.createCommodity(req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateCommodity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await commoditiesService.updateCommodity(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteCommodity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await commoditiesService.deleteCommodity(req.params.id);
    return sendSuccess(res, { message: 'Commodity deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// Commodity Categories
export async function listCommodityCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const categories = await commoditiesService.listCommodityCategories();
    return sendSuccess(res, categories);
  } catch (err) { next(err); }
}

export async function getCommodityCategoryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await commoditiesService.getCommodityCategoryById(req.params.id);
    if (!data) return sendError(res, 'Commodity category not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createCommodityCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await commoditiesService.createCommodityCategory(req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateCommodityCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await commoditiesService.updateCommodityCategory(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteCommodityCategory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await commoditiesService.deleteCommodityCategory(req.params.id);
    return sendSuccess(res, { message: 'Commodity category deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
