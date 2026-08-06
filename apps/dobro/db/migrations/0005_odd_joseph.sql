CREATE TABLE "referencia_perfis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" text NOT NULL,
	"nome" text,
	"nota" text,
	"origem" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "referencia_perfis_handle_unique" UNIQUE("handle")
);
