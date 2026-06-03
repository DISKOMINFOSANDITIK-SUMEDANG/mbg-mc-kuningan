import { Request, Response } from 'express';
import * as schoolsService from '../services/schools.service';
import { sendSuccess, sendError } from '../utils/response';

export async function listSchools(req: Request, res: Response) {
  try {
    const data = await schoolsService.listSchools({
      q: req.query.q as string,
      district: req.query.district as string,
      village: req.query.village as string,
      level: req.query.level as string,
      status: req.query.status as string,
      sppg_id: req.query.sppg_id as string,
    });
    res.json(data);
  } catch (error) {
    console.error('Schools API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSchoolById(req: Request, res: Response) {
  try {
    const data = await schoolsService.getSchoolById(req.params.id);
    if (!data) return sendError(res, 'School not found', 404);
    res.json(data);
  } catch (error) {
    console.error('School API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSchoolReports(req: Request, res: Response) {
  try {
    const reports = await schoolsService.getSchoolReports(
      req.params.id,
      req.query.date as string
    );
    res.json({ reports, count: reports.length });
  } catch (error) {
    console.error('School reports API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}
