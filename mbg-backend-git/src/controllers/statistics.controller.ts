import { Request, Response } from 'express';
import * as statisticsService from '../services/statistics.service';
import * as settingsService from '../services/cms/settings.service';
import { sendError } from '../utils/response';

export async function getStatistics(_req: Request, res: Response) {
  try {
    const data = await statisticsService.getStatistics();
    res.json(data);
  } catch (error) {
    console.error('Statistics API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getBeneficiaryTargets(_req: Request, res: Response) {
  try {
    const data = await settingsService.getBeneficiaryTargets();
    res.json(data);
  } catch (error) {
    console.error('Beneficiary targets API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSchoolStatistics(_req: Request, res: Response) {
  try {
    const data = await statisticsService.getSchoolStatistics();
    res.json(data);
  } catch (error) {
    console.error('School statistics API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
