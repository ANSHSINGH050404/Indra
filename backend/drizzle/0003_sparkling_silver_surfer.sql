CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"market_id" uuid NOT NULL,
	"outcome_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
