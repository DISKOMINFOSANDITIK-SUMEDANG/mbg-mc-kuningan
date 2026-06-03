import { Request, Response } from 'express';
import * as contactService from '../services/contact.service';
import { sendError } from '../utils/response';

export async function submitContact(req: Request, res: Response) {
  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.headers['x-real-ip'] as string) || req.ip || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    // Bot detection
    const botPatterns = [/bot\b/i, /crawler/i, /spider/i, /curl\//i, /wget\//i, /python-/i, /postman/i, /insomnia/i];
    if (!userAgent || userAgent.length < 10 || botPatterns.some(p => p.test(userAgent))) {
      return res.status(403).json({ success: false, error: 'Permintaan tidak valid' });
    }

    // Oversized body check
    const raw = JSON.stringify(req.body);
    if (raw.length > 10240) {
      return res.status(413).json({ success: false, error: 'Permintaan terlalu besar' });
    }

    const result = await contactService.submitContact(req.body, ip, userAgent);
    return res.status(result.status).json(
      result.success
        ? { success: true, message: result.message }
        : { success: false, error: result.error }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({ success: false, error: 'Terjadi kesalahan. Silakan coba lagi.' });
  }
}

export async function getSppgOptions(req: Request, res: Response) {
  try {
    const data = await contactService.getSppgOptions();
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.json({ success: true, data });
  } catch (error) {
    console.error('SPPG options error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSchoolOptions(req: Request, res: Response) {
  try {
    const q = req.query.q as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    const { rows, hasMore, total } = await contactService.getSchoolOptions(q, page, limit);
    res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    res.json({ success: true, data: rows, hasMore, total });
  } catch (error) {
    console.error('School options error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
