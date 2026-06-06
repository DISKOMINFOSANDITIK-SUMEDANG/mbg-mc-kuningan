-- Add tujuan and target_id columns to laporan_pesan
-- tujuan: optional, indicates whether the message is directed to a school or sppg
-- target_id: optional UUID referencing the specific school or sppg

DO $$
BEGIN
  IF to_regclass('public.laporan_pesan') IS NOT NULL THEN
    ALTER TABLE laporan_pesan
      ADD COLUMN IF NOT EXISTS tujuan VARCHAR(50) NULL,
      ADD COLUMN IF NOT EXISTS target_id UUID NULL;
  END IF;
END $$;
-- Add tujuan and target_id columns to laporan_pesan
-- tujuan: optional, indicates whether the message is directed to a school or sppg
-- target_id: optional UUID referencing the specific school or sppg

ALTER TABLE laporan_pesan
  ADD COLUMN IF NOT EXISTS tujuan VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS target_id UUID NULL;
