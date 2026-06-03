-- Migration: Make nutrition fields on menu_items nullable
-- Date: 2026-04-07
-- Description: Remove NOT NULL constraints and CHECK constraints from
--              calories, protein, carbs, fat so they can be saved without values.

ALTER TABLE menu_items
  ALTER COLUMN calories DROP NOT NULL,
  ALTER COLUMN protein  DROP NOT NULL,
  ALTER COLUMN carbs    DROP NOT NULL,
  ALTER COLUMN fat      DROP NOT NULL,
  DROP CONSTRAINT IF EXISTS menu_items_calories_check,
  DROP CONSTRAINT IF EXISTS menu_items_protein_check,
  DROP CONSTRAINT IF EXISTS menu_items_carbs_check,
  DROP CONSTRAINT IF EXISTS menu_items_fat_check;
