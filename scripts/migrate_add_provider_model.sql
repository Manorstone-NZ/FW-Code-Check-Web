-- Migration: Add provider and model columns to analyses and baselines tables
ALTER TABLE analyses ADD COLUMN provider TEXT;
ALTER TABLE analyses ADD COLUMN model TEXT;
ALTER TABLE baselines ADD COLUMN provider TEXT;
ALTER TABLE baselines ADD COLUMN model TEXT;
