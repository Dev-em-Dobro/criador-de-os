CREATE TABLE "conteudo_previsoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"classe" text NOT NULL,
	"confianca" text NOT NULL,
	"taxa_salvamentos_pct" double precision,
	"taxa_compartilhamentos_pct" double precision,
	"retencao_pct" double precision,
	"classe_salvamentos" text,
	"classe_compartilhamentos" text,
	"classe_retencao" text,
	"aposta_principal" text,
	"riscos" jsonb,
	"fura_total" integer,
	"fura_notas" jsonb,
	"fura_justificativa" text,
	"resumo" text,
	"modelo" text,
	"registrada_em" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conteudo_previsoes" ADD CONSTRAINT "conteudo_previsoes_post_id_conteudo_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."conteudo_posts"("id") ON DELETE cascade ON UPDATE no action;