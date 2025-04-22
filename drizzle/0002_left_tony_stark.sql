ALTER TABLE "scan_result" ALTER COLUMN "authencity_score" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scan_result" ALTER COLUMN "confidence_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "scan_result" ALTER COLUMN "reasoning" DROP NOT NULL;