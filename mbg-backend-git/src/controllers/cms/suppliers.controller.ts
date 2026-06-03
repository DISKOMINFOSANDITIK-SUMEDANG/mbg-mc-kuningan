import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as suppliersService from '../../services/cms/suppliers.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

// Suppliers
export async function listSuppliers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', search } = req.query as Record<string, string>;
    const result = await suppliersService.listSuppliers({
      q: search, page: parseInt(page), limit: parseInt(limit)
    }, req.user!.userId, req.user!.role);
    return sendPaginated(res, result.suppliers, result.total, parseInt(page), parseInt(limit));
  } catch (err) { next(err); }
}

export async function getSupplierById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await suppliersService.getSupplierById(req.params.id);
    if (!data) return sendError(res, 'Supplier not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createSupplier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await suppliersService.createSupplier(req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateSupplier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await suppliersService.updateSupplier(req.params.id, req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteSupplier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await suppliersService.deleteSupplier(req.params.id);
    return sendSuccess(res, { message: 'Supplier deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function searchSuppliers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as Record<string, string>;
    const results = await suppliersService.searchSuppliers(q || '');
    return sendSuccess(res, results);
  } catch (err) { next(err); }
}

// Supplier Products
export async function listSupplierProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', supplier_id, search } = req.query as Record<string, string>;
    const result = await suppliersService.listSupplierProducts({
      q: search, supplier_id, page: parseInt(page), limit: parseInt(limit)
    }, req.user!.userId, req.user!.role);
    return sendPaginated(res, result.products, result.total, parseInt(page), parseInt(limit));
  } catch (err) { next(err); }
}

export async function getSupplierProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await suppliersService.getSupplierProductById(req.params.id);
    if (!data) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createSupplierProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await suppliersService.createSupplierProduct(req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateSupplierProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await suppliersService.updateSupplierProduct(req.params.id, req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteSupplierProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await suppliersService.deleteSupplierProduct(req.params.id);
    return sendSuccess(res, { message: 'Supplier product deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function autoExpireProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await suppliersService.autoExpireSupplierProducts();
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}
