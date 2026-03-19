ALTER TABLE "users" ALTER COLUMN "isVerified" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "markets" ALTER COLUMN "created_by" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "positions" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "isAdmin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "points" integer DEFAULT 1000 NOT NULL;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "yes_pool" integer DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE "markets" ADD COLUMN "no_pool" integer DEFAULT 500 NOT NULL;