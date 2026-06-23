CREATE TYPE "public"."patrol_status" AS ENUM('em_andamento', 'concluida', 'validada');--> statement-breakpoint
CREATE TYPE "public"."presence_type" AS ENUM('entrada', 'saida');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('tecnico', 'administrador', 'gestor');--> statement-breakpoint
CREATE TABLE "feedback_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"school_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "feedbacks" (
	"id" serial PRIMARY KEY NOT NULL,
	"school_id" integer NOT NULL,
	"evaluator_name" varchar(255) NOT NULL,
	"evaluator_role" varchar(255),
	"rating" integer NOT NULL,
	"comment" text,
	"category" varchar(100),
	"target_user_id" integer,
	"token" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedbacks_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "patrulhas" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"observations" text,
	"audio_transcription" text,
	"checklist" jsonb DEFAULT '[]'::jsonb,
	"other_description" text,
	"status" "patrol_status" DEFAULT 'em_andamento' NOT NULL,
	"validated_by" integer,
	"validated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presence_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"school_id" integer NOT NULL,
	"type" "presence_type" NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "schools_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"role" "user_role" NOT NULL,
	"school_id" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "feedback_links" ADD CONSTRAINT "feedback_links_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_links" ADD CONSTRAINT "feedback_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patrulhas" ADD CONSTRAINT "patrulhas_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patrulhas" ADD CONSTRAINT "patrulhas_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patrulhas" ADD CONSTRAINT "patrulhas_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_records" ADD CONSTRAINT "presence_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presence_records" ADD CONSTRAINT "presence_records_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE no action ON UPDATE no action;