-- Migration: Add active status flag for SPPG
-- Description: Adds `is_active` column to `sppgs` table for active/nonactive toggle in CMS.

ALTER TABLE public.sppgs
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_sppgs_is_active ON public.sppgs(is_active);
