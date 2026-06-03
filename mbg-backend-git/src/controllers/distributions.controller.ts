import { Request, Response } from 'express';
import * as distributionsService from '../services/distributions.service';
import { sendError } from '../utils/response';

export async function listDistributions(req: Request, res: Response) {
  try {
    const data = await distributionsService.listDistributions({
      sppg_id: req.query.sppg_id as string,
      date: req.query.date as string,
      recipient_type: req.query.recipient_type as string,
      recipient_id: req.query.recipient_id as string,
    });
    res.json(data);
  } catch (error) {
    console.error('Distributions API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
