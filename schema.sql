


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Create blank public profile (username set later in onboarding)
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- Create blank private contact record
  INSERT INTO public.profile_private (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Auto-creates blank profiles and profile_private rows on user signup.';



CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"() IS 'Returns true if the authenticated user has role=admin in JWT app_metadata.';



CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "card_id" "text",
    "previous_value" "text",
    "new_value" "text",
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_audit_log" IS 'Immutable admin action log. INSERT and SELECT only. No UPDATE or DELETE policies.';



CREATE TABLE IF NOT EXISTS "public"."cards" (
    "card_id" "text" NOT NULL,
    "nfc_url" "text" NOT NULL,
    "status" "text" DEFAULT 'unclaimed'::"text" NOT NULL,
    "owner_user_id" "uuid",
    "batch_id" "text",
    "claim_code_hash" "text",
    "activated_at" timestamp with time zone,
    "first_tap_at" timestamp with time zone,
    "failed_attempts" integer DEFAULT 0 NOT NULL,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "cards_card_id_format" CHECK ((("card_id" = "lower"("card_id")) OR ("card_id" = "upper"("card_id")))),
    CONSTRAINT "cards_status_check" CHECK (("status" = ANY (ARRAY['unclaimed'::"text", 'claimed'::"text", 'suspended'::"text", 'replaced'::"text", 'reserved'::"text"])))
);


ALTER TABLE "public"."cards" OWNER TO "postgres";


COMMENT ON TABLE "public"."cards" IS 'One row per physical NFC card. Controls activation, ownership, and tap redirect behaviour.';



CREATE TABLE IF NOT EXISTS "public"."founder_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stripe_session_id" "text" NOT NULL,
    "customer_email" "text",
    "customer_name" "text",
    "card_id" "text",
    "allocation_number" integer,
    "status" "text" DEFAULT 'confirmed'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."founder_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_key" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "stock_total" integer DEFAULT 0 NOT NULL,
    "stock_sold" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_gallery" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "caption" "text",
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profile_gallery" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profile_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text" NOT NULL,
    "url" "text" NOT NULL,
    "icon" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid",
    "link_type" "text" DEFAULT 'custom'::"text",
    "position" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "custom_label" "text"
);


ALTER TABLE "public"."profile_links" OWNER TO "postgres";


COMMENT ON TABLE "public"."profile_links" IS 'Ordered social and contact links displayed on a user public profile page.';



CREATE TABLE IF NOT EXISTS "public"."profile_private" (
    "user_id" "uuid" NOT NULL,
    "email" "text",
    "phone" "text",
    "show_email" boolean DEFAULT false NOT NULL,
    "show_phone" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."profile_private" OWNER TO "postgres";


COMMENT ON TABLE "public"."profile_private" IS 'Private contact details. Owner-only RLS. Never publicly readable.
   show_email and show_phone flags control whether the frontend displays
   contact details on the public profile page. The display flags are
   read server-side — the actual values are never returned in a public query.';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "display_name" "text",
    "bio" "text",
    "avatar_url" "text",
    "job_title" "text",
    "company" "text",
    "is_public" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text",
    "location" "text",
    "website" "text",
    "headline" "text",
    "theme_style" "text" DEFAULT 'minimal'::"text",
    "accent_color" "text" DEFAULT '#ffffff'::"text",
    "button_style" "text" DEFAULT 'pill'::"text",
    "background_style" "text" DEFAULT 'solid_black'::"text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Public profile fields only. No private contact data stored here.
   Private contact details are in profile_private, protected by owner-only RLS.';



CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "role" "text",
    "rating" integer NOT NULL,
    "quote" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "profile_username" "text",
    "avatar_url" "text",
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "reviews_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tap_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "card_id" "text",
    "tapped_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_agent" "text",
    "profile_id" "uuid",
    "event_type" "text" DEFAULT 'card_tap'::"text",
    "link_id" "uuid",
    "link_label" "text",
    "destination_url" "text",
    "card_code" "text"
);


ALTER TABLE "public"."tap_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."tap_events" IS 'One row per NFC card tap. Lightweight analytics log. Never publicly readable.';



CREATE TABLE IF NOT EXISTS "public"."user_billing" (
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text",
    "subscription_tier" "text",
    "subscription_status" "text",
    "subscription_current_period_end" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_billing" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_pkey" PRIMARY KEY ("card_id");



ALTER TABLE ONLY "public"."founder_orders"
    ADD CONSTRAINT "founder_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."founder_orders"
    ADD CONSTRAINT "founder_orders_stripe_session_id_key" UNIQUE ("stripe_session_id");



ALTER TABLE ONLY "public"."product_inventory"
    ADD CONSTRAINT "product_inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_inventory"
    ADD CONSTRAINT "product_inventory_product_key_key" UNIQUE ("product_key");



ALTER TABLE ONLY "public"."profile_gallery"
    ADD CONSTRAINT "profile_gallery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_links"
    ADD CONSTRAINT "profile_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profile_private"
    ADD CONSTRAINT "profile_private_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tap_events"
    ADD CONSTRAINT "tap_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_billing"
    ADD CONSTRAINT "user_billing_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_audit_log_card_id" ON "public"."admin_audit_log" USING "btree" ("card_id");



CREATE INDEX "idx_cards_batch_id" ON "public"."cards" USING "btree" ("batch_id");



CREATE INDEX "idx_cards_owner" ON "public"."cards" USING "btree" ("owner_user_id");



CREATE INDEX "idx_cards_status" ON "public"."cards" USING "btree" ("status");



CREATE INDEX "idx_profile_links_user_sort" ON "public"."profile_links" USING "btree" ("user_id", "sort_order");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_tap_events_card_id" ON "public"."tap_events" USING "btree" ("card_id");



CREATE INDEX "profile_links_position_idx" ON "public"."profile_links" USING "btree" ("profile_id", "position");



CREATE INDEX "profile_links_profile_id_idx" ON "public"."profile_links" USING "btree" ("profile_id");



CREATE INDEX "user_billing_stripe_customer_id_idx" ON "public"."user_billing" USING "btree" ("stripe_customer_id");



CREATE OR REPLACE TRIGGER "set_profile_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_updated_at"();



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("card_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cards"
    ADD CONSTRAINT "cards_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."founder_orders"
    ADD CONSTRAINT "founder_orders_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("card_id");



ALTER TABLE ONLY "public"."profile_gallery"
    ADD CONSTRAINT "profile_gallery_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_links"
    ADD CONSTRAINT "profile_links_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_links"
    ADD CONSTRAINT "profile_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profile_private"
    ADD CONSTRAINT "profile_private_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tap_events"
    ADD CONSTRAINT "tap_events_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("card_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_billing"
    ADD CONSTRAINT "user_billing_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can insert audit log entries" ON "public"."admin_audit_log" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin can read profile_private" ON "public"."profile_private" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can view audit log" ON "public"."admin_audit_log" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin full access to cards" ON "public"."cards" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access to profile_links" ON "public"."profile_links" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access to profiles" ON "public"."profiles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access to tap_events" ON "public"."tap_events" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Claim or manage own card" ON "public"."cards" FOR UPDATE TO "authenticated" USING ((("owner_user_id" IS NULL) OR ("owner_user_id" = "auth"."uid"()))) WITH CHECK (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Owner can delete own links" ON "public"."profile_links" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Owner can insert own links" ON "public"."profile_links" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Owner can manage gallery" ON "public"."profile_gallery" TO "authenticated" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Owner can read own links" ON "public"."profile_links" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Owner can read own private data" ON "public"."profile_private" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Owner can read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Owner can read tap events" ON "public"."tap_events" FOR SELECT TO "authenticated" USING ((("profile_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."cards"
  WHERE (("cards"."card_id" = "tap_events"."card_id") AND ("cards"."owner_user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profile_links"
  WHERE (("profile_links"."id" = "tap_events"."link_id") AND ("profile_links"."profile_id" = "auth"."uid"()))))));



CREATE POLICY "Owner can read their own card" ON "public"."cards" FOR SELECT TO "authenticated" USING (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "Owner can update own links" ON "public"."profile_links" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Owner can update own private data" ON "public"."profile_private" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Owner can update own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Public can insert tap events" ON "public"."tap_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can read active links" ON "public"."profile_links" FOR SELECT TO "anon" USING (("is_active" = true));



CREATE POLICY "Public can read active profile links" ON "public"."profile_links" FOR SELECT TO "authenticated", "anon" USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "profile_links"."profile_id") AND ("profiles"."is_public" = true))))));



CREATE POLICY "Public can read cards" ON "public"."cards" FOR SELECT USING (true);



CREATE POLICY "Public can read gallery" ON "public"."profile_gallery" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Public can read tap events" ON "public"."tap_events" FOR SELECT USING (false);



CREATE POLICY "Public can view profile gallery" ON "public"."profile_gallery" FOR SELECT USING (true);



CREATE POLICY "Public profile links readable by all" ON "public"."profile_links" FOR SELECT USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "profile_links"."user_id") AND ("p"."is_public" = true))))));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public profiles readable by all" ON "public"."profiles" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Users can delete own gallery rows" ON "public"."profile_gallery" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "profile_gallery"."profile_id") AND ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own profile links" ON "public"."profile_links" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can insert own gallery rows" ON "public"."profile_gallery" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "profile_gallery"."profile_id") AND ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own links" ON "public"."profile_links" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own profile links" ON "public"."profile_links" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can manage own gallery" ON "public"."profile_gallery" TO "authenticated" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can manage their own gallery" ON "public"."profile_gallery" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can read own cards" ON "public"."cards" FOR SELECT USING (("auth"."uid"() = "owner_user_id"));



CREATE POLICY "Users can read own links" ON "public"."profile_links" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can select own links" ON "public"."profile_links" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own gallery rows" ON "public"."profile_gallery" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "profile_gallery"."profile_id") AND ("profiles"."id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "profile_gallery"."profile_id") AND ("profiles"."id" = "auth"."uid"())))));



CREATE POLICY "Users can update own links" ON "public"."profile_links" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile links" ON "public"."profile_links" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view all gallery images" ON "public"."profile_gallery" FOR SELECT USING (true);



CREATE POLICY "Users can view own gallery rows" ON "public"."profile_gallery" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "profile_gallery"."profile_id") AND ("profiles"."id" = "auth"."uid"())))));



ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."founder_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gallery owner delete" ON "public"."profile_gallery" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "gallery owner insert" ON "public"."profile_gallery" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "gallery owner update" ON "public"."profile_gallery" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "gallery public read" ON "public"."profile_gallery" FOR SELECT USING (true);



CREATE POLICY "own billing read" ON "public"."user_billing" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."product_inventory" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_gallery" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profile_private" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_auth_insert_own" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"text")));



CREATE POLICY "reviews_auth_read_own" ON "public"."reviews" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "reviews_public_read_approved" ON "public"."reviews" FOR SELECT USING (("status" = 'approved'::"text"));



ALTER TABLE "public"."tap_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_billing" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."admin_audit_log" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."cards" TO "anon";
GRANT ALL ON TABLE "public"."cards" TO "authenticated";
GRANT ALL ON TABLE "public"."cards" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."founder_orders" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."founder_orders" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."founder_orders" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."product_inventory" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."product_inventory" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."product_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."profile_gallery" TO "anon";
GRANT ALL ON TABLE "public"."profile_gallery" TO "authenticated";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_gallery" TO "service_role";



GRANT ALL ON TABLE "public"."profile_links" TO "anon";
GRANT ALL ON TABLE "public"."profile_links" TO "authenticated";
GRANT ALL ON TABLE "public"."profile_links" TO "service_role";



GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_private" TO "anon";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_private" TO "authenticated";
GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."profile_private" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."reviews" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."tap_events" TO "anon";
GRANT ALL ON TABLE "public"."tap_events" TO "authenticated";
GRANT ALL ON TABLE "public"."tap_events" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."user_billing" TO "authenticated";
GRANT ALL ON TABLE "public"."user_billing" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT UPDATE ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLES TO "service_role";







