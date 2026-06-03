import { Request, Response } from 'express';
import * as sppgsService from '../services/sppgs.service';
import { sendError } from '../utils/response';

export async function listSppgs(req: Request, res: Response) {
  try {
    const data = await sppgsService.listSppgs({
      q: req.query.q as string,
      type: req.query.type as string,
      location: req.query.location as string,
      include_stats: req.query.include_stats as string,
      paginate: req.query.paginate as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    });
    res.json(data);
  } catch (error) {
    console.error('SPPGs API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSppgById(req: Request, res: Response) {
  try {
    const data = await sppgsService.getSppgById(req.params.id);
    if (!data) return sendError(res, 'SPPG not found', 404);
    res.json(data);
  } catch (error) {
    console.error('SPPG API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSppgDistributions(req: Request, res: Response) {
  try {
    const data = await sppgsService.getSppgDistributions(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('SPPG distributions API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSppgKitchenPhotos(req: Request, res: Response) {
  try {
    const data = await sppgsService.getSppgKitchenPhotos(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('Kitchen photos API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSppgReports(req: Request, res: Response) {
  try {
    const data = await sppgsService.getSppgReports(req.params.id, req.query.date as string);
    res.json(data);
  } catch (error) {
    console.error('SPPG reports API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSppgSchools(req: Request, res: Response) {
  try {
    const data = await sppgsService.getSppgSchools(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('SPPG schools API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
