CREATE TABLE "survey_question_sets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"survey_id" bigint NOT NULL,
	"questions_json" jsonb NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
