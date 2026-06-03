import { Request, Response } from 'express';
import * as groupsService from '../services/groups.service';
import { sendError } from '../utils/response';

export async function listGroups(req: Request, res: Response) {
  try {
    const data = await groupsService.listGroups(req.query.q as string, req.query.sppg_id as string);
    res.json(data);
  } catch (error) {
    console.error('Groups API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getGroupById(req: Request, res: Response) {
  try {
    const data = await groupsService.getGroupById(req.params.id);
    if (!data) return sendError(res, 'Group not found', 404);
    res.json(data);
  } catch (error) {
    console.error('Group API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getGroupSppgs(req: Request, res: Response) {
  try {
    const data = await groupsService.getGroupSppgs(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('Group SPPGs API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
