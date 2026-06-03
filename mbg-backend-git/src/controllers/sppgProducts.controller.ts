import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import * as sppgProductsService from '../services/sppgProducts.service';
import { sendError } from '../utils/response';

export async function getProducts(req: Request, res: Response) {
  try {
    const offtaker_id = req.query.offtaker_id as string | undefined;
    const is_available = req.query.is_available as string | undefined;
    const data = await sppgProductsService.getOfftakerProducts({ offtaker_id, is_available });
    res.json({ success: true, data, total: data.length });
  } catch (error: any) {
    console.error('Error in GET /sppg/products:', error);
    sendError(res, error.message || 'Internal server error', 500);
  }
}

export async function getSupplierProducts(req: Request, res: Response) {
  try {
    const supplier_id = req.query.supplier_id as string | undefined;
    const data = await sppgProductsService.getSupplierProducts({ supplier_id });
    res.json({ success: true, data, total: data.length });
  } catch (error: any) {
    console.error('Error in GET /sppg/supplier-products:', error);
    sendError(res, error.message || 'Internal server error', 500);
  }
}

export async function getProductRequests(req: AuthenticatedRequest, res: Response) {
  try {
    const sppgId = req.user?.sppgId;
    if (!sppgId) return sendError(res, 'SPPG ID not found in user session', 400);

    const status = req.query.status as string | undefined;
    const data = await sppgProductsService.getProductRequests(sppgId, status);
    res.json({ success: true, data, total: data.length });
  } catch (error: any) {
    console.error('Error in GET /sppg/product-requests:', error);
    sendError(res, error.message || 'Internal server error', 500);
  }
}

export async function createProductRequest(req: AuthenticatedRequest, res: Response) {
  try {
    const sppgId = req.user?.sppgId;
    const userId = req.user?.userId;
    if (!sppgId) return sendError(res, 'SPPG ID not found in user session', 400);

    const data = await sppgProductsService.createProductRequest(sppgId, userId!, req.body);
    res.status(201).json({ success: true, message: 'Product request created successfully', data });
  } catch (error: any) {
    console.error('Error in POST /sppg/product-requests:', error);
    const status = error.status || 500;
    sendError(res, error.message || 'Internal server error', status);
  }
}
