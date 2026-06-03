import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { isTokenBlacklisted } from '../utils/tokenBlacklist';
import { AuthenticatedRequest, UserRole } from '../types/auth';

export function withAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies?.auth_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (isTokenBlacklisted(token)) {
      res.status(401).json({ error: 'Token has been invalidated' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid authentication token' });
      return;
    }

    if (!decoded.userId || !decoded.email || !decoded.role) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      schoolId: decoded.schoolId,
      sppgId: decoded.sppgId,
      supplierId: decoded.supplierId,
      offtakerId: decoded.offtakerId,
    };

    next();
  } catch (error) {
    res.status(401).json({
      error: 'Invalid authentication token',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function withRoleAuth(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    withAuth(req, res, () => {
      if (!req.user || !allowedRoles.includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }
      next();
    });
  };
}

export const withAdminAuth = withRoleAuth('administrator');
export const withSchoolAuth = withRoleAuth('administrator', 'sekolah');
export const withSppgAuth = withRoleAuth('administrator', 'sppg');
export const withAllRolesAuth = withRoleAuth('administrator', 'sekolah', 'sppg', 'pemasok', 'offtaker', 'dinas_pertanian');
export const withSupplierAuth = withRoleAuth('administrator', 'pemasok');
export const withOfftakerAuth = withRoleAuth('administrator', 'offtaker');
export const withDinasPertanianAuth = withRoleAuth('administrator', 'dinas_pertanian');
export const withSupplierManagementAuth = withRoleAuth('administrator', 'pemasok', 'dinas_pertanian');
