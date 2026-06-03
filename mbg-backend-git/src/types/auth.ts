import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  sppgId?: string;
  supplierId?: string;
  offtakerId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export type UserRole = 'administrator' | 'sekolah' | 'sppg' | 'pemasok' | 'offtaker' | 'dinas_pertanian';
