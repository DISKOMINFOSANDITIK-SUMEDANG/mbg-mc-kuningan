import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as transactionsService from '../../services/cms/transactions.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

// ========== Offtaker Sales ==========
export async function listOfftakerSales(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', sppg_id, payment_status, start_date, end_date } = req.query as Record<string, string>;
    const result = await transactionsService.listOfftakerSales({
      sppg_id, payment_status, start_date, end_date, page: parseInt(page), limit: parseInt(limit)
    }, req.user!.userId, req.user!.role);
    return sendPaginated(res, result.data, result.pagination.total, parseInt(page), parseInt(limit));
  } catch (err) { next(err); }
}

export async function getOfftakerSaleById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.getOfftakerSaleById(req.params.id, req.user!.userId, req.user!.role);
    if (!data) return sendError(res, 'Offtaker sale not found', 404);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function createOfftakerSale(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.createOfftakerSale(req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// ========== Sales Transactions ==========
export async function listSalesTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await transactionsService.listSalesTransactions(req.user!.userId, req.user!.role);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getSalesTransactionById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.getSalesTransactionById(req.params.id);
    if (!data) return sendError(res, 'Transaction not found', 404);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function createSalesTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.createSalesTransaction(req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateSalesTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.updateSalesTransaction(req.params.id, req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteSalesTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await transactionsService.deleteSalesTransaction(req.params.id, req.user!.userId, req.user!.role);
    return sendSuccess(res, { message: 'Transaction deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// ========== Offtaker Purchases ==========
export async function listOfftakerPurchases(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', supplier_id, start_date, end_date } = req.query as Record<string, string>;
    const result = await transactionsService.listOfftakerPurchases({
      supplier_id, start_date, end_date, page: parseInt(page), limit: parseInt(limit)
    }, req.user!.userId, req.user!.role);
    return sendPaginated(res, result.data, result.pagination.total, parseInt(page), parseInt(limit));
  } catch (err) { next(err); }
}

export async function createOfftakerPurchase(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.createOfftakerPurchase(req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// ========== Additional Costs ==========
export async function listAdditionalCosts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { active } = req.query as Record<string, string>;
    const data = await transactionsService.listAdditionalCosts({ active });
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createAdditionalCost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.createAdditionalCost(req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateAdditionalCost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.updateAdditionalCost({ ...req.body, id: req.params.id });
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteAdditionalCost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await transactionsService.deleteAdditionalCost(req.params.id);
    return sendSuccess(res, { message: 'Additional cost deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// ========== Additional Cost Types ==========
export async function listAdditionalCostTypes(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { active } = req.query as Record<string, string>;
    const data = await transactionsService.listAdditionalCostTypes({ active });
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function getAdditionalCostTypeById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.getAdditionalCostTypeById(req.params.id);
    if (!data) return sendError(res, 'Additional cost type not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createAdditionalCostType(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.createAdditionalCostType(req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateAdditionalCostType(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.updateAdditionalCostType(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteAdditionalCostType(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await transactionsService.deleteAdditionalCostType(req.params.id);
    return sendSuccess(res, { message: 'Additional cost type deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// ========== Unified Transactions ==========
export async function getUnifiedTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await transactionsService.getUnifiedTransactions(
      req.user!.userId,
      req.user!.role,
      req.query as Record<string, string>
    );
    return sendPaginated(res, result.data, result.pagination.total, result.pagination.page, result.pagination.limit);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function createUnifiedTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await transactionsService.createUnifiedTransaction(req.user!.userId, req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
