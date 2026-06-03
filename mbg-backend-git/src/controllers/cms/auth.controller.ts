import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types/auth';
import * as cmsAuthService from '../../services/cms/auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { hashPassword, verifyPassword } from '../../utils/password';
import db from '../../db/pool';

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const user = await cmsAuthService.getMe(req.user!.userId);
    if (!user) return sendError(res, 'User not found', 404);
    return sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function updateAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { email, current_password, new_password } = req.body;
    const userId = req.user!.userId;

    // Build the update payload
    const updateData: { email?: string; password_hash?: string } = {};

    if (email) updateData.email = email;

    if (new_password) {
      if (!current_password) {
        return sendError(res, 'Password saat ini harus diisi', 400);
      }
      // Verify current password
      const { rows } = await db.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
      if (!rows[0]) return sendError(res, 'User not found', 404);

      const valid = await verifyPassword(current_password, rows[0].password_hash);
      if (!valid) return sendError(res, 'Password saat ini salah', 400);

      updateData.password_hash = await hashPassword(new_password);
    }

    const result = await cmsAuthService.updateAccount(userId, updateData);
    return sendSuccess(res, result);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const profile = await cmsAuthService.getProfile(req.user!.userId);
    return sendSuccess(res, profile);
  } catch (err) { next(err); }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await cmsAuthService.updateProfile(req.user!.userId, req.body);
    return sendSuccess(res, result);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

export async function getOfftakerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const profile = await cmsAuthService.getOfftakerProfile(req.user!.userId);
    return sendSuccess(res, profile);
  } catch (err) { next(err); }
}

export async function updateOfftakerProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const result = await cmsAuthService.updateOfftakerProfile(req.user!.userId, req.body);
    return sendSuccess(res, result);
  } catch (err: any) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}
