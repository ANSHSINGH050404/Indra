ALTER TABLE "market_resolutions" ADD COLUMN "total_payout" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "market_resolutions" ADD COLUMN "winners_count" integer DEFAULT 0 NOT NULL;