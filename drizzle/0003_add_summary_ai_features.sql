-- Add equity_concerns and predictions columns to summaries table
ALTER TABLE "summaries" ADD COLUMN "equity_concerns" jsonb;
ALTER TABLE "summaries" ADD COLUMN "predictions" jsonb;
