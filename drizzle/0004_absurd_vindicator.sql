CREATE TABLE "ai_guard_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_guard_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"namespace" text NOT NULL,
	"user_id" text NOT NULL,
	"kind" text NOT NULL,
	"reserved_micros" integer NOT NULL,
	"input_bytes" integer NOT NULL,
	"max_output_tokens" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_guard_windows" (
	"key" text PRIMARY KEY NOT NULL,
	"reserved_micros" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_guard_requests_namespace_time_idx" ON "ai_guard_requests" USING btree ("namespace","created_at");--> statement-breakpoint
CREATE INDEX "ai_guard_reservations_namespace_time_idx" ON "ai_guard_reservations" USING btree ("namespace","created_at");