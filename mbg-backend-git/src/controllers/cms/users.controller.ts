import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as usersService from '../../services/cms/users.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export async function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', search, q, role, is_active, sppg_unlinked } = req.query as Record<string, string>;
    const result = await usersService.listUsers({
      q: q || search, role, is_active, sppg_unlinked, page: parseInt(page), limit: parseInt(limit)
    });
    return sendPaginated(res, result.users, result.total, parseInt(page), parseInt(limit));
  } catch (err) { next(err); }
}

export async function getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body);
    return sendSuccess(res, user, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    return sendSuccess(res, user);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function resetUserPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await usersService.resetUserPassword(req.params.id);
    return sendSuccess(res, result);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUser(req.params.id);
    return sendSuccess(res, { message: 'User deactivated' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function permanentlyDeleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await usersService.permanentlyDeleteUser(req.params.id);
    return sendSuccess(res, { message: 'User permanently deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
