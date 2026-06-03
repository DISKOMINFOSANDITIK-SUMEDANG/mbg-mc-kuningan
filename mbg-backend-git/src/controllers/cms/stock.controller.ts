import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as stockService from '../../services/cms/stock.service';
import { sendSuccess, sendError } from '../../utils/response';

// ========== Stock Movements ==========
export async function listStockMovements(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { supplier_id, date_from, date_to } = req.query as Record<string, string>;
    const data = await stockService.listStockMovements(
      { supplier_id, date_from, date_to },
      req.user!.userId, req.user!.role
    );
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function getStockMovementById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await stockService.getStockMovementById(req.params.id, req.user!.userId, req.user!.role);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function createStockMovement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await stockService.createStockMovement(req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateStockMovement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await stockService.updateStockMovement(req.params.id, req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteStockMovement(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await stockService.deleteStockMovement(req.params.id, req.user!.userId, req.user!.role);
    return sendSuccess(res, { message: 'Stock movement deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function autoExpireStocks(req: Request, res: Response, next: NextFunction) {
  try {
    const cronSecret = (req.headers['x-cron-secret'] as string) || (req.body?.secret as string);
    const data = await stockService.autoExpireStocks(req.headers.authorization, cronSecret);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// ========== Product Requests ==========
export async function listProductRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await stockService.listProductRequests(req.user!.userId, req.user!.role);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function getProductRequestById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await stockService.getProductRequestById(req.params.id);
    if (!data) return sendError(res, 'Product request not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function updateProductRequestStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await stockService.updateProductRequestStatus(req.params.id, req.body);
    if (!data) return sendError(res, 'Product request not found', 404);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// ========== Served Entities ==========
export async function getServedEntities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await stockService.getServedEntities(req.user!.userId);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// ========== Available Products (SPPG) ==========
export async function getAvailableProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { search, category_id, available } = req.query as Record<string, string>;
    const data = await stockService.getAvailableProductsForSppg({ search, category_id, available });
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

// ========== Products ==========
export async function listProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { search, supplier_id, limit } = req.query as Record<string, string>;
    const data = await stockService.listProducts({ search, supplier_id, limit });
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

// ========== User Entity Lookups ==========
export async function getOfftakerUserByUserId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId || req.user!.userId;
    const data = await stockService.getOfftakerUserByUserId(userId);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getSupplierUserByUserId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId || req.user!.userId;
    const data = await stockService.getSupplierUserByUserId(userId);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

// ========== School-SPPG Assignment ==========
export async function assignSchoolToSppg(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { school_id } = req.body;
    if (!school_id) return sendError(res, 'school_id is required', 400);
    const data = await stockService.assignSchoolToSppg(req.user!.userId, school_id);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function removeSchoolFromSppg(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const schoolId = req.query.school_id as string;
    if (!schoolId) return sendError(res, 'school_id is required', 400);
    const data = await stockService.removeSchoolFromSppg(req.user!.userId, schoolId);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function searchSchoolsForSppg(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { q, limit } = req.query as Record<string, string>;
    const data = await stockService.searchSchoolsForSppg(req.user!.userId, { q, limit });
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
