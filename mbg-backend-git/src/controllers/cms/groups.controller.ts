import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as groupsService from '../../services/cms/groups.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

// Groups
export async function listGroups(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', q } = req.query as Record<string, string>;
    const result = await groupsService.listGroups({ page: parseInt(page), limit: parseInt(limit), q });
    return sendPaginated(res, result.groups, result.total, result.page, result.limit);
  } catch (err) { next(err); }
}

export async function getGroupById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const group = await groupsService.getGroupById(req.params.id);
    if (!group) return sendError(res, 'Group not found', 404);
    return sendSuccess(res, group);
  } catch (err) { next(err); }
}

export async function createGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const group = await groupsService.createGroup(req.body);
    return sendSuccess(res, group, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const group = await groupsService.updateGroup(req.params.id, req.body);
    return sendSuccess(res, group);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteGroup(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await groupsService.deleteGroup(req.params.id);
    return sendSuccess(res, { message: 'Group deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// Foundations
export async function listFoundations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', all } = req.query as Record<string, string>;
    const result = await groupsService.listFoundations({ page: parseInt(page), limit: parseInt(limit), all: all === 'true' });
    if (all === 'true') {
      return sendSuccess(res, result.foundations);
    }
    return sendPaginated(res, result.foundations, result.total!, result.page!, result.limit!);
  } catch (err) { next(err); }
}

export async function getFoundationById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await groupsService.getFoundationById(req.params.id);
    if (!data) return sendError(res, 'Foundation not found', 404);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createFoundation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await groupsService.createFoundation(req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateFoundation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await groupsService.updateFoundation(req.params.id, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteFoundation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await groupsService.deleteFoundation(req.params.id);
    return sendSuccess(res, { message: 'Foundation deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
