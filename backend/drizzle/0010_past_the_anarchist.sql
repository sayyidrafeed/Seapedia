CREATE TABLE "system_time_offset" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"offset_seconds" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
