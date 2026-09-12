ALTER TABLE "error_sheets" ADD COLUMN "pinned_at" timestamp;--> statement-breakpoint
ALTER TABLE "job_applications" ADD COLUMN "pinned_at" timestamp;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "archived_at" timestamp;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "pinned_at" timestamp;