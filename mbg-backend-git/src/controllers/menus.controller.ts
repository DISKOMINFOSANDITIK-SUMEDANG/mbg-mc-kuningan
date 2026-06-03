import { Request, Response } from 'express';
import * as menusService from '../services/menus.service';
import { sendError } from '../utils/response';

export async function listMenus(req: Request, res: Response) {
  try {
    const data = await menusService.listMenus(req.query.sppg_id as string);
    res.json(data);
  } catch (error) {
    console.error('Menus API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function listMenuItems(req: Request, res: Response) {
  try {
    const data = await menusService.listMenuItems(req.query.q as string);
    res.json(data);
  } catch (error) {
    console.error('Menu items API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
