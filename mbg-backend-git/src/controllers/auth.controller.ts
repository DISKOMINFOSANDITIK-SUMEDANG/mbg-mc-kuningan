import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { addToBlacklist } from '../utils/tokenBlacklist';
import { verifyToken, generateToken } from '../utils/jwt';
import * as authService from '../services/auth.service';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { uploadToS3 } from '../lib/s3';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    const result = await authService.loginUser(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ user: result.user, token: result.token });
  } catch (err) { next(err); }
}

export async function mobileLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    const result = await authService.mobileLogin(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Email atau password salah, atau bukan akun sekolah' });
    }

    return res.json(result);
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    let token = req.cookies?.auth_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) token = authHeader.substring(7);
    }
    if (token) addToBlacklist(token);

    res.clearCookie('auth_token', { path: '/' });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

export async function verifyTokenEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) return res.json({ valid: false });

    const decoded = verifyToken(token);
    if (!decoded) return res.json({ valid: false });

    const user = await authService.verifyTokenUser(decoded.userId);
    if (!user) return res.json({ valid: false });

    return res.json({ valid: true, id: user.id, email: user.email, role: user.role });
  } catch (err) { next(err); }
}

export async function refreshToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const result = await authService.refreshUserToken(req.user.userId);
    if (!result) return res.status(401).json({ error: 'User not found' });

    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.json({ user: result.user, token: result.token });
  } catch (err) { next(err); }
}

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const profile = await authService.getProfile(req.user.userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    return res.json(profile);
  } catch (err) { next(err); }
}

export async function getMe(req: AuthenticatedRequest, res: Response, _next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  return res.json(req.user);
}

export async function changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Konfirmasi password tidak cocok' });
    }

    const result = await authService.changePassword(req.user.userId, oldPassword, newPassword);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ message: 'Password berhasil diubah' });
  } catch (err) { next(err); }
}

export async function getSppgProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    let sppgId = req.query.sppg_id as string || req.user.sppgId;

    // If still no sppg_id, try getting it from sppg_users
    if (!sppgId) {
      const sppgUser = await authService.getSppgUser(req.user.userId);
      if (sppgUser) sppgId = sppgUser.sppg_id;
    }

    // If still no sppg_id, try getting it from school_users → schools.sppg_id
    if (!sppgId && req.user.schoolId) {
      const { rows } = await (await import('../db/pool')).default.query(
        `SELECT sppg_id FROM schools WHERE id = $1`,
        [req.user.schoolId]
      );
      if (rows.length > 0 && rows[0].sppg_id) sppgId = rows[0].sppg_id;
    }

    if (!sppgId) return res.status(404).json({ error: 'SPPG not found' });

    const profile = await authService.getSppgProfile(sppgId);
    if (!profile) return res.status(404).json({ error: 'SPPG not found' });

    // Get contact person
    const { rows: contacts } = await (await import('../db/pool')).default.query(
      `SELECT u.email, p.full_name, p.phone, p.avatar_url, su.position
       FROM sppg_users su
       JOIN users u ON u.id = su.user_id
       LEFT JOIN user_profiles p ON p.user_id = su.user_id
       WHERE su.sppg_id = $1 LIMIT 1`,
      [sppgId]
    );

    const contact = contacts[0] || {};
    return res.json({
      ...profile,
      full_name: contact.full_name || null,
      phone: contact.phone || null,
      position: contact.position || null,
      contact_person: contacts[0] || null,
    });
  } catch (err) { next(err); }
}

export async function getDistricts(_req: Request, res: Response, next: NextFunction) {
  try {
    const districts = await authService.getDistricts();
    return res.json({ success: true, data: districts });
  } catch (err) { next(err); }
}

export async function getVillages(req: Request, res: Response, next: NextFunction) {
  try {
    const district = req.query.district as string;
    if (!district) return res.status(400).json({ error: 'District parameter required' });
    const villages = await authService.getVillages(district);
    return res.json({ success: true, data: villages });
  } catch (err) { next(err); }
}

export async function getSppgListEndpoint(_req: Request, res: Response, next: NextFunction) {
  try {
    const sppgs = await authService.getSppgList();
    return res.json({ success: true, data: sppgs });
  } catch (err) { next(err); }
}

export async function getMbgReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.schoolId) {
      return res.status(403).json({ error: 'School access required' });
    }
    const { start_date, end_date, limit, offset } = req.query as any;
    const result = await authService.getMbgReports(req.user.userId, req.user.schoolId, {
      startDate: start_date,
      endDate: end_date,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    return res.json(result);
  } catch (err) { next(err); }
}

export async function createMbgReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

    const { school_id, sppg_id, report_date, menu_photo_url, students_photo_url,
            latitude, longitude, location_accuracy, device_timestamp,
            is_rapel, rapel_start_date, rapel_end_date } = req.body;

    if (!school_id || !report_date || !menu_photo_url || !students_photo_url || !device_timestamp) {
      return res.status(400).json({ error: 'Data laporan tidak lengkap. school_id, report_date, menu_photo_url, students_photo_url, dan device_timestamp wajib diisi.' });
    }

    const result = await authService.createMbgReport({
      school_id, sppg_id: sppg_id || null, report_date,
      menu_photo_url, students_photo_url,
      latitude: latitude || null, longitude: longitude || null,
      location_accuracy: location_accuracy || null,
      device_timestamp, submitted_by: req.user.userId,
      is_rapel, rapel_start_date, rapel_end_date,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.report);
  } catch (err) { next(err); }
}

export async function getMbgReportById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const report = await authService.getMbgReportById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    return res.json(report);
  } catch (err) { next(err); }
}

export async function deleteMbgReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const result = await authService.deleteMbgReport(req.params.id, req.user.userId);
    if (!result.success) return res.status(400).json({ error: result.error });
    return res.json({ success: true, message: 'Report deleted' });
  } catch (err) { next(err); }
}

export async function checkDailyReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const schoolId = req.query.school_id as string;
    if (!schoolId) return res.status(400).json({ error: 'school_id required' });
    const reportDate = req.query.report_date as string | undefined;
    const result = await authService.checkDailyReport(schoolId, reportDate);
    return res.json(result);
  } catch (err) { next(err); }
}

export async function getDistributions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user || req.user.role !== 'sekolah' || !req.user.schoolId) {
      return res.status(403).json({ error: 'School access required' });
    }
    const result = await authService.getSchoolDistributions(req.user.schoolId, {
      start_date: req.query.start_date as string,
      end_date: req.query.end_date as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    });
    return res.json(result);
  } catch (err) { next(err); }
}

export async function getDistributionByIdEndpoint(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const dist = await authService.getDistributionById(req.params.id);
    if (!dist) return res.status(404).json({ error: 'Distribution not found' });
    return res.json(dist);
  } catch (err) { next(err); }
}

export async function getSchoolProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const profile = await authService.getSchoolProfile(req.user.userId);
    if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
    return res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function updateSchoolProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const body = { ...req.body };
    // Inject school_id from authenticated user if not provided
    if (!body.school_id && req.user.schoolId) {
      body.school_id = req.user.schoolId;
    }
    // Map school_sppg_id to sppg_id for backward compatibility with mobile app
    if (body.school_sppg_id !== undefined && body.sppg_id === undefined) {
      body.sppg_id = body.school_sppg_id;
    }
    const result = await authService.updateSchoolProfile(req.user.userId, body);
    // Return updated profile data so the client can update local state
    const profile = await authService.getSchoolProfile(req.user.userId);
    return res.json({ success: true, data: profile });
  } catch (err) { next(err); }
}

export async function uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image data required' });

    // Store base64 directly in DB (same as original)
    const db = (await import('../db/pool')).default;
    await db.query(
      `UPDATE user_profiles SET avatar_url = $1, updated_at = NOW() WHERE user_id = $2`,
      [image, req.user.userId]
    );
    return res.json({ success: true, data: { avatar_url: image } });
  } catch (err) { next(err); }
}

export async function getSppgUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    const sppgUser = await authService.getSppgUser(req.user.userId);
    if (!sppgUser) return res.status(404).json({ error: 'SPPG user not found' });
    return res.json(sppgUser);
  } catch (err) { next(err); }
}

export async function setCookie(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return res.json({ message: 'Cookie set' });
  } catch (err) { next(err); }
}

export async function forceClearCookie(_req: Request, res: Response) {
  res.clearCookie('auth_token', { path: '/' });
  return res.json({ message: 'Cookie cleared' });
}

export async function uploadImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const folder = (req.body.folder || 'mbg-reports').replace(/\.\./g, '');
    const ext = path.extname(req.file.originalname);
    const filename = `${Date.now()}-${uuidv4().substring(0, 8)}${ext}`;
    const prefix = config.s3.bucketPrefix;
    const key = prefix ? `${prefix}/${folder}/${filename}` : `${folder}/${filename}`;

    const result = await uploadToS3(config.s3.bucket, key, req.file.buffer, req.file.mimetype);
    return res.json({ url: result.url, path: result.path });
  } catch (err) { next(err); }
}

export async function loginRedirect(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password diperlukan' });
    }

    const result = await authService.loginUser(email, password);
    if (!result) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    let redirectUrl = '/cms/dashboard';
    if (result.user.role === 'sppg') {
      redirectUrl = '/cms/dashboard/sppg';
    } else if (result.user.role === 'sekolah') {
      redirectUrl = '/cms/dashboard/sekolah';
    }

    return res.redirect(302, redirectUrl);
  } catch (err) { next(err); }
}

export async function getMbgReportStatistics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const schoolId = req.query.school_id as string;
    const month = req.query.month as string | undefined;
    const year = req.query.year as string | undefined;

    if (!schoolId) return res.status(400).json({ error: 'school_id is required' });

    const data = await authService.getMbgReportStatistics(schoolId, month, year);
    return res.json({ success: true, data });
  } catch (err) { next(err); }
}

export async function uploadMbgPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    const { photo, fileName } = req.body;
    if (!photo || !fileName) return res.status(400).json({ error: 'Photo and fileName required' });

    // Convert base64 to buffer
    const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const prefix = config.s3.photoBucketPrefix;
    const key = prefix ? `${prefix}/mbg-reports/${sanitizedName}` : `mbg-reports/${sanitizedName}`;

    const result = await uploadToS3(config.s3.bucket, key, buffer, 'image/jpeg', { upsert: true });
    return res.json({ url: result.url, path: result.path });
  } catch (err) { next(err); }
}
