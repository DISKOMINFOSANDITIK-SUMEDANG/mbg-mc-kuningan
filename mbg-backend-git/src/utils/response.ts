import { Response } from 'express';

export function sendSuccess(res: Response, data: any, status = 200) {
  return res.status(status).json(data);
}

export function sendError(res: Response, error: string, status = 500, details?: string) {
  const body: any = { error };
  if (details && process.env.NODE_ENV !== 'production') {
    body.details = details;
  }
  return res.status(status).json(body);
}

export function sendPaginated(
  res: Response,
  data: any[],
  total: number,
  page: number,
  limit: number
) {
  return res.json({
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
