
CREATE TABLE "public"."users" (
    "id" uuid NOT NULL,
    "updated_at" timestamp with time zone,
    "username" text,
    "full_name" text,
    "avatar_url" text,
    "website" text,
    "role" text DEFAULT 'resident'::text,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "username_key" UNIQUE ("username"),
    CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."users" OWNER TO "postgres";
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON "public"."users" FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));
CREATE POLICY "Users can update own profile." ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));

CREATE TYPE "public"."request_category" AS ENUM (
    'food',
    'cleanliness',
    'maintenance',
    'fees',
    'others'
);

CREATE TYPE "public"."request_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

CREATE TYPE "public"."request_status" AS ENUM (
    'pending',
    'in_progress',
    'resolved'
);

CREATE TABLE "public"."requests" (
    "id" uuid NOT NULL DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "user_id" uuid NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category" "public"."request_category" NOT NULL,
    "priority" "public"."request_priority" NOT NULL,
    "status" "public"."request_status" NOT NULL DEFAULT 'pending',
    "image_url" "text",
    PRIMARY KEY ("id"),
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."requests" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own requests." ON "public"."requests" FOR SELECT USING (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can insert their own requests." ON "public"."requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));
CREATE POLICY "Users can update their own requests." ON "public"."requests" FOR UPDATE USING (("auth"."uid"() = "user_id"));
-- Admins should be able to see all requests
-- This requires a function to check for the admin role, which we will create later.

CREATE TABLE "public"."request_comments" (
    "id" uuid NOT NULL DEFAULT "gen_random_uuid"(),
    "created_at" timestamp with time zone NOT NULL DEFAULT "now"(),
    "request_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "comment" "text" NOT NULL,
    PRIMARY KEY ("id"),
    FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE,
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."request_comments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view comments on the requests." ON "public"."request_comments" FOR SELECT USING (exists(select 1 from requests where requests.id = request_comments.request_id and requests.user_id = auth.uid()));
CREATE POLICY "Users can insert comments on the requests." ON "public"."request_comments" FOR INSERT WITH CHECK (exists(select 1 from requests where requests.id = request_comments.request_id and requests.user_id = auth.uid()));
-- Admin access for comments will also be handled later.

