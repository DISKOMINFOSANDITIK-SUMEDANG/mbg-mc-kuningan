import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import * as offtakerService from '../services/offtaker.service';
import { sendError } from '../utils/response';

export async function getRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Not authenticated', 401);

    const offtakerId = await offtakerService.getOfftakerId(userId);
    if (!offtakerId) return sendError(res, 'User is not associated with an offtaker', 403);

    const status = req.query.status as string | undefined;
    const data = await offtakerService.getRequests(offtakerId, status);
    res.json({ success: true, data, total: data.length });
  } catch (error) {
    console.error('[Offtaker Requests] Error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getRequestById(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Not authenticated', 401);

    const offtakerId = await offtakerService.getOfftakerId(userId);
    if (!offtakerId) return sendError(res, 'Not authorized', 403);

    const data = await offtakerService.getRequestById(req.params.id, offtakerId);
    if (!data) return sendError(res, 'Request not found', 404);

    res.json({ success: true, data });
  } catch (error) {
    console.error('[Offtaker Request Detail] Error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function updateRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Not authenticated', 401);

    const offtakerId = await offtakerService.getOfftakerId(userId);
    if (!offtakerId) return sendError(res, 'Not authorized', 403);

    const data = await offtakerService.updateRequest(req.params.id, offtakerId, userId, req.body);
    if (!data) return sendError(res, 'Request not found or already processed', 404);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('[Update Request] Error:', error);
    sendError(res, error.message || 'Internal server error', error.status || 500);
  }
}
