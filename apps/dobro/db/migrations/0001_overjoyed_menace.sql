CREATE TABLE "conteudo_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referencia_id" uuid,
	"titulo" text NOT NULL,
	"capa_url" text,
	"data_programada" timestamp,
	"cta_final" text,
	"link_presente_notion" text,
	"estado" text DEFAULT 'rascunho' NOT NULL,
	"plataforma" text DEFAULT 'instagram' NOT NULL,
	"formato" text DEFAULT 'carrossel' NOT NULL,
	"gancho" text,
	"pauta" text,
	"legenda" text,
	"hashtags" text,
	"roteiro" jsonb,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canal" text NOT NULL,
	"origem_url" text,
	"tipo" text DEFAULT 'link' NOT NULL,
	"formato_ref" text,
	"conteudo_bruto" text,
	"nota_time" text,
	"capa_url" text,
	"metricas_ref" jsonb,
	"analise" text,
	"status" text DEFAULT 'pendente' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "conteudo_posts" ADD CONSTRAINT "conteudo_posts_referencia_id_referencias_id_fk" FOREIGN KEY ("referencia_id") REFERENCES "public"."referencias"("id") ON DELETE set null ON UPDATE no action;