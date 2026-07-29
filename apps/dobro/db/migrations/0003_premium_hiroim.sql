CREATE TABLE "conteudo_desempenho" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid,
	"data" timestamp,
	"formato" text DEFAULT 'reel' NOT NULL,
	"tema" text,
	"alcance" integer,
	"visualizacoes" integer,
	"curtidas" integer,
	"comentarios" integer,
	"compartilhamentos" integer,
	"salvamentos" integer,
	"visitas_perfil" integer,
	"seguidores" integer,
	"duracao_s" integer,
	"tempo_medio_s" double precision,
	"permalink" text,
	"media_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conteudo_desempenho" ADD CONSTRAINT "conteudo_desempenho_post_id_conteudo_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."conteudo_posts"("id") ON DELETE set null ON UPDATE no action;