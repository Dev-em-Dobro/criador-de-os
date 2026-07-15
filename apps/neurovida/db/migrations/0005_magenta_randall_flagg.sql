CREATE TABLE "hotmart_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"period" text NOT NULL,
	"product" text NOT NULL,
	"product_id" text,
	"gross_revenue" double precision NOT NULL,
	"net_revenue" double precision NOT NULL,
	"sales_count" integer NOT NULL,
	"currency" text NOT NULL,
	"updated_at" timestamp NOT NULL
);
