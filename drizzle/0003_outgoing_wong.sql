CREATE TYPE "public"."operator_run_kind" AS ENUM('night', 'morning');--> statement-breakpoint
CREATE TABLE "operator_runs" (
	"user_id" text NOT NULL,
	"kind" "operator_run_kind" NOT NULL,
	"day" date NOT NULL,
	"note_id" uuid,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "operator_runs_user_id_kind_day_pk" PRIMARY KEY("user_id","kind","day")
);
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "is_dump" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "operator_runs" ADD CONSTRAINT "operator_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operator_runs" ADD CONSTRAINT "operator_runs_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;