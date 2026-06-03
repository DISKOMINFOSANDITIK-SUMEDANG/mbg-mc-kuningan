import { Request, Response } from 'express';
import * as reportsService from '../services/reports.service';
import { sendError } from '../utils/response';

export async function getSchoolReports(req: Request, res: Response) {
  try {
    const date = req.query.date as string;
    const status = req.query.status as 'reported' | 'not-reported';
    if (!date || !status) {
      return sendError(res, 'Date and status parameters are required', 400);
    }
    const data = await reportsService.getSchoolReports(date, status);
    res.json(data);
  } catch (error: any) {
    console.error('School reports API error:', error);
    sendError(res, error.message || 'Internal server error', 500);
  }
}

export async function getSchoolReportsRecap(req: Request, res: Response) {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    if (!startDate || !endDate) {
      return sendError(res, 'Start date and end date parameters are required', 400);
    }
    const data = await reportsService.getSchoolReportsRecap(startDate, endDate);
    res.json(data);
  } catch (error: any) {
    console.error('School reports recap API error:', error);
    sendError(res, error.message || 'Internal server error', 500);
  }
}

export async function exportSchoolsReport(req: Request, res: Response) {
  try {
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    const data = await reportsService.exportSchoolsReport(startDate, endDate);
    res.json(data);
  } catch (error: any) {
    console.error('Export schools report API error:', error);
    sendError(res, error.message || 'Internal server error', 500);
  }
}

export async function getSppgDistributionDetails(req: Request, res: Response) {
  try {
    const date = req.query.date as string | undefined;
    const data = await reportsService.getSppgDistributionDetails(date);
    res.json(data);
  } catch (error) {
    console.error('SPPG distribution details API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSppgDistributionRecap(req: Request, res: Response) {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    if (!startDate || !endDate) {
      return sendError(res, 'startDate and endDate parameters are required', 400);
    }
    const data = await reportsService.getSppgDistributionRecap(startDate, endDate);
    res.json(data);
  } catch (error) {
    console.error('SPPG distribution recap API error:', error);
    sendError(res, 'Internal server error', 500);
  }
}

export async function getSppgDistributionsRecap(req: Request, res: Response) {
  try {
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    if (!startDate || !endDate) {
      return sendError(res, 'Start date and end date parameters are required', 400);
    }
    const data = await reportsService.getSppgDistributionsRecap(startDate, endDate);
    res.json(data);
  } catch (error: any) {
    console.error('SPPG distributions recap API error:', error);
    sendError(res, error.message || 'Internal server error', 500);
  }
}

export async function getSppgDistributionsSubtab(req: Request, res: Response) {
  try {
    const date = req.query.date as string;
    const status = req.query.status as 'distributed' | 'not-distributed';
    if (!date || !status) {
      return sendError(res, 'Date and status parameters are required', 400);
    }
    const data = await reportsService.getSppgDistributionsSubtab(date, status);
    res.json(data);
  } catch (error: any) {
    console.error('SPPG distributions subtab API error:', error);
    sendError(res, error.message || 'Internal server error', 500);
  }
}
