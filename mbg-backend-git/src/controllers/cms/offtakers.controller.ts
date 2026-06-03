import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as offtakersService from '../../services/cms/offtakers.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

// Offtakers
export async function listOfftakers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await offtakersService.listOfftakers(req.user!.userId, req.user!.role);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getOfftakerById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await offtakersService.getOfftakerById(req.params.id);
    if (!data) return sendError(res, 'Offtaker not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createOfftaker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await offtakersService.createOfftaker(req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateOfftaker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await offtakersService.updateOfftaker(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteOfftaker(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await offtakersService.deleteOfftaker(req.params.id);
    return sendSuccess(res, { message: 'Offtaker deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function searchOfftakers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as Record<string, string>;
    const results = await offtakersService.searchOfftakers(q || '');
    return sendSuccess(res, results);
  } catch (err) { next(err); }
}

// Offtaker Products
export async function listOfftakerProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { offtaker_id, search } = req.query as Record<string, string>;
    const result = await offtakersService.listOfftakerProducts({
      q: search, offtaker_id
    }, req.user!.userId, req.user!.role);
    return sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function getOfftakerProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await offtakersService.getOfftakerProductById(req.params.id);
    if (!data) return sendError(res, 'Offtaker product not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createOfftakerProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await offtakersService.createOfftakerProduct(req.body, req.user!.userId, req.user!.role);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateOfftakerProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await offtakersService.updateOfftakerProduct(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteOfftakerProduct(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await offtakersService.deleteOfftakerProduct(req.params.id);
    return sendSuccess(res, { message: 'Offtaker product deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
