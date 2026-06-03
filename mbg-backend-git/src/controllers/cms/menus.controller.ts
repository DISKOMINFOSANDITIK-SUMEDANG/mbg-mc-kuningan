import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as menusService from '../../services/cms/menus.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

// Menus
export async function listMenus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', sppg_id } = req.query as Record<string, string>;
    const sppgId = req.user!.role === 'sppg' ? req.user!.sppgId : sppg_id;
    const result = await menusService.listMenus({ page: parseInt(page), limit: parseInt(limit), sppg_id: sppgId });
    return sendPaginated(res, result.menus, result.total, result.page, result.limit);
  } catch (err) { next(err); }
}

export async function getMenuById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const menu = await menusService.getMenuById(req.params.id);
    if (!menu) return sendError(res, 'Menu not found', 404);
    return sendSuccess(res, menu);
  } catch (err) { next(err); }
}

export async function createMenu(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sppgId = req.user!.sppgId || req.body.sppg_id;
    const menu = await menusService.createMenu({ ...req.body, sppg_id: sppgId });
    return sendSuccess(res, menu, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateMenu(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const menu = await menusService.updateMenu(req.params.id, req.body);
    return sendSuccess(res, menu);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteMenu(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await menusService.deleteMenu(req.params.id);
    return sendSuccess(res, { message: 'Menu deleted successfully' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// Menu Items
export async function listMenuItems(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '50', sppg_id, q } = req.query as Record<string, string>;
    const sppgId = req.user!.role === 'sppg' ? req.user!.sppgId : sppg_id;
    const result = await menusService.listMenuItems({ page: parseInt(page), limit: parseInt(limit), sppg_id: sppgId, q });
    return sendPaginated(res, result.items, result.total, result.page, result.limit);
  } catch (err) { next(err); }
}

export async function getMenuItemById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await menusService.getMenuItemById(req.params.id);
    if (!item) return sendError(res, 'Menu item not found', 404);
    return sendSuccess(res, item);
  } catch (err) { next(err); }
}

export async function createMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sppgId = req.user!.sppgId || req.body.sppg_id;
    const item = await menusService.createMenuItem({ ...req.body, sppg_id: sppgId });
    return sendSuccess(res, item, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await menusService.updateMenuItem(req.params.id, req.body);
    return sendSuccess(res, item);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteMenuItem(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await menusService.deleteMenuItem(req.params.id);
    return sendSuccess(res, { message: 'Menu item deleted successfully' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
