ALTER TABLE "stores" ADD COLUMN "rating" numeric(3, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "total_products" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sold_count" integer DEFAULT 0 NOT NULL;