import { Router } from 'express';
import { withAuth, withSchoolAuth, withSppgAuth, withAllRolesAuth } from '../middleware/auth';
import { loginRateLimiter } from '../middleware/rateLimiter';
import { upload, uploadMemory } from '../middleware/upload';
import * as authCtrl from '../controllers/auth.controller';

const router = Router();

// Public auth routes
router.post('/login', loginRateLimiter, authCtrl.login);
router.post('/mobile-login', loginRateLimiter, authCtrl.mobileLogin);
router.post('/logout', authCtrl.logout);
router.post('/verify-token', authCtrl.verifyTokenEndpoint);
router.post('/set-cookie', authCtrl.setCookie);
router.get('/force-clear-cookie', authCtrl.forceClearCookie);

// Protected auth routes
router.post('/refresh-token', withAuth, authCtrl.refreshToken);
router.get('/profile', withAuth, authCtrl.getProfile);
router.get('/me', withAuth, authCtrl.getMe);
router.post('/change-password', withAuth, authCtrl.changePassword);
router.get('/sppg-profile', withAuth, authCtrl.getSppgProfile);
router.get('/sppg', withAuth, authCtrl.getSppgListEndpoint);
router.get('/sppg-user', withAuth, authCtrl.getSppgUser);
router.get('/districts', withAuth, authCtrl.getDistricts);
router.get('/villages', withAuth, authCtrl.getVillages);

// School profile
router.get('/school-profile', withAuth, authCtrl.getSchoolProfile);
router.put('/school-profile', withAuth, authCtrl.updateSchoolProfile);
router.post('/school-profile/avatar', withAuth, authCtrl.uploadAvatar);

// MBG Reports
router.post('/mbg-reports', withAuth, authCtrl.createMbgReport);
router.get('/mbg-reports', withAuth, authCtrl.getMbgReports);
router.get('/mbg-reports/statistics', withAuth, authCtrl.getMbgReportStatistics);
router.get('/mbg-reports/check-daily', withAuth, authCtrl.checkDailyReport);
router.get('/mbg-reports/:id', withAuth, authCtrl.getMbgReportById);
router.delete('/mbg-reports/:id', withAuth, authCtrl.deleteMbgReport);

// Login redirect (sets cookie + redirects to role-based dashboard)
router.post('/login-redirect', loginRateLimiter, authCtrl.loginRedirect);

// Distributions (school)
router.get('/distributions', withAuth, authCtrl.getDistributions);
router.get('/distributions/:id', withAuth, authCtrl.getDistributionByIdEndpoint);

// File uploads
router.post('/upload-image', withAuth, uploadMemory.single('file'), authCtrl.uploadImage);
router.post('/upload-mbg-photo', withAuth, authCtrl.uploadMbgPhoto);

export default router;
