-- ============================================================
-- SQL PATCH: Fix Row-Level Security (RLS) Policies
-- File: database_rls_patch.sql
-- ============================================================
-- Run this in your Supabase SQL Editor to resolve:
-- 1. SOS insertion RLS violation errors
-- 2. User profile registration RLS violation errors
-- ============================================================

-- ------------------------------------------------------------
-- 1. FIX SOS REQUESTS INSERTION POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sos_requests_insert_anon" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_insert_authenticated" ON public.sos_requests;

-- Allow public anonymous visitors to submit emergency SOS requests
CREATE POLICY "sos_requests_insert_anon"
    ON public.sos_requests FOR INSERT
    TO anon
    WITH CHECK (TRUE);

-- Allow authenticated users to submit emergency SOS requests
CREATE POLICY "sos_requests_insert_authenticated"
    ON public.sos_requests FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- ------------------------------------------------------------
-- 2. FIX VICTIM LOCATIONS INSERTION POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "victim_locations_insert_any_auth" ON public.victim_locations;
DROP POLICY IF EXISTS "victim_locations_insert_anon" ON public.victim_locations;
DROP POLICY IF EXISTS "victim_locations_insert_authenticated" ON public.victim_locations;

-- Allow anonymous visitors to write GPS location breadcrumbs
CREATE POLICY "victim_locations_insert_anon"
    ON public.victim_locations FOR INSERT
    TO anon
    WITH CHECK (TRUE);

-- Allow authenticated users to write GPS location breadcrumbs
CREATE POLICY "victim_locations_insert_authenticated"
    ON public.victim_locations FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- ------------------------------------------------------------
-- 3. FIX USERS REGISTRATION INSERTION POLICIES
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "users_insert_self" ON public.users;

-- Allow authenticated users to insert their own profile row (if trigger falls back)
CREATE POLICY "users_insert_self"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Allow anonymous sign-up inserts (if metadata trigger handles it asynchronously)
CREATE POLICY "users_insert_anon"
    ON public.users FOR INSERT
    TO anon
    WITH CHECK (TRUE);

-- ------------------------------------------------------------
-- 4. FIX RELIEF CAMPS PUBLIC SELECT POLICY (For Nearest Camp Lookup)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "relief_camps_select_anon" ON public.relief_camps;

CREATE POLICY "relief_camps_select_anon"
    ON public.relief_camps FOR SELECT
    TO anon
    USING (TRUE);
