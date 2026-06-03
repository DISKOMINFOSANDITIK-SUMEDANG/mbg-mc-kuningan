import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as schoolsService from '../../services/cms/schools.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export async function listSchools(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', search, sppg_id } = req.query as Record<string, string>;
    const result = await schoolsService.listSchools({
      q: search, page: parseInt(page), limit: parseInt(limit), sppg_id
    });
    return sendPaginated(res, result.schools, result.total, parseInt(page), parseInt(limit));
  } catch (err) { next(err); }
}

export async function searchSchools(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as Record<string, string>;
    const results = await schoolsService.searchSchools(q || '');
    return sendSuccess(res, results);
  } catch (err) { next(err); }
}

export async function getSchoolById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const school = await schoolsService.getSchoolById(req.params.id);
    if (!school) return sendError(res, 'School not found', 404);
    return sendSuccess(res, school);
  } catch (err) { next(err); }
}

export async function createSchool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const school = await schoolsService.createSchool(req.body);
    return sendSuccess(res, school, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateSchool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const school = await schoolsService.updateSchool(req.params.id, req.body);
    return sendSuccess(res, school);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteSchool(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await schoolsService.deleteSchool(req.params.id);
    return sendSuccess(res, { message: 'School deleted successfully' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
