import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as sppgsService from '../../services/cms/sppgs.service';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export async function listSppgs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '10', search } = req.query as Record<string, string>;
    const result = await sppgsService.listSppgs({ q: search, page: parseInt(page), limit: parseInt(limit) });
    return sendPaginated(res, result.sppgs, result.total, parseInt(page), parseInt(limit));
  } catch (err) { next(err); }
}

export async function getSppgById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sppg = await sppgsService.getSppgById(req.params.id);
    if (!sppg) return sendError(res, 'SPPG not found', 404);
    return sendSuccess(res, sppg);
  } catch (err) { next(err); }
}

export async function createSppg(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sppg = await sppgsService.createSppg(req.body);
    return sendSuccess(res, sppg, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateSppg(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const sppg = await sppgsService.updateSppg(req.params.id, req.body);
    return sendSuccess(res, sppg);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteSppg(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await sppgsService.deleteSppg(req.params.id);
    return sendSuccess(res, { message: 'SPPG deleted successfully' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function searchSppgs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { q } = req.query as Record<string, string>;
    const results = await sppgsService.searchSppgs(q || '');
    return sendSuccess(res, results);
  } catch (err) { next(err); }
}

export async function getSppgOptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const options = await sppgsService.getSppgOptions();
    return sendSuccess(res, options);
  } catch (err) { next(err); }
}

// Nutritionist
export async function getNutritionist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.getNutritionist(req.params.sppgId);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createNutritionist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.createNutritionist(req.params.sppgId, req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateNutritionist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.updateNutritionist(req.params.sppgId, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteNutritionist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await sppgsService.deleteNutritionist(req.params.sppgId);
    return sendSuccess(res, { message: 'Nutritionist deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// Facilities
export async function getFacilities(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.getFacilities(req.params.sppgId);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createFacility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.createFacility(req.params.sppgId, req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateFacility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.updateFacility(req.params.sppgId, req.params.facilityId, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteFacility(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await sppgsService.deleteFacility(req.params.sppgId, req.params.facilityId);
    return sendSuccess(res, { message: 'Facility deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// Kitchen Photos
export async function getKitchenPhotos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.getKitchenPhotos(req.params.sppgId);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createKitchenPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.createKitchenPhoto(req.params.sppgId, req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateKitchenPhotos(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.updateKitchenPhotos(req.params.sppgId, req.body.photos);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateKitchenPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.updateKitchenPhoto(req.params.sppgId, req.params.photoId, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function deleteKitchenPhoto(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await sppgsService.deleteKitchenPhoto(req.params.sppgId, req.params.photoId);
    return sendSuccess(res, { message: 'Photo deleted' });
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// SLHS Certificate
export async function getSlhsCertificate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.getSlhsCertificate(req.params.sppgId);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}

export async function createSlhsCertificate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.createSlhsCertificate(req.params.sppgId, req.body);
    return sendSuccess(res, data, 201);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function updateSlhsCertificate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.updateSlhsCertificate(req.params.sppgId, req.body);
    return sendSuccess(res, data);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

// SPPG Schools
export async function getSppgSchools(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await sppgsService.getSppgSchools(req.params.sppgId);
    return sendSuccess(res, data);
  } catch (err) { next(err); }
}
