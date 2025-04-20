CREATE TABLE "repositories" (
	"id" text PRIMARY KEY NOT NULL,
	"repo_name" text NOT NULL,
	"repo_url" text NOT NULL,
	"user_id" text,
	"last_scanned_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scan_result" (
	"id" text PRIMARY KEY NOT NULL,
	"repo_id" text,
	"authencity_score" integer NOT NULL,
	"confidence_level" integer NOT NULL,
	"reasoning" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repositories" ADD CONSTRAINT "repositories_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_result" ADD CONSTRAINT "scan_result_repo_id_repositories_id_fk" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;