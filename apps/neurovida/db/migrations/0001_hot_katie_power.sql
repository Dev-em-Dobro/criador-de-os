CREATE TABLE "lead_source_rows" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lead_source_rows_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"email" text,
	"phone" text,
	"name" text,
	"raw" jsonb NOT NULL,
	"imported_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"phone" text,
	"name" text,
	"sources" jsonb NOT NULL,
	"is_aluno" boolean NOT NULL,
	"respondeu_pesquisa" boolean NOT NULL,
	"has_email" boolean NOT NULL,
	"has_phone" boolean NOT NULL,
	"record_count" integer NOT NULL,
	"created_at" timestamp NOT NULL
);
