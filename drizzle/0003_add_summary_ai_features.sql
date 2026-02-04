-- Add equity_concerns and predictions columns to summaries table
ALTER TABLE "summaries" ADD COLUMN IF NOT EXISTS "equity_concerns" jsonb;
ALTER TABLE "summaries" ADD COLUMN IF NOT EXISTS "predictions" jsonb;
