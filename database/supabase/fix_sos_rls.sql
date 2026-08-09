-- ============================================================
-- RLS Fix: SOS requests insert for anonymous and authenticated users
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing insert policies that may not be working correctly
DROP POLICY IF EXISTS "sos_requests_insert_anon" ON public.sos_requests;
DROP POLICY IF EXISTS "sos_requests_insert_authenticated" ON public.sos_requests;

-- Re-create with explicit role targets
-- Allow anonymous users (not logged in) to submit SOS
CREATE POLICY "sos_requests_insert_anon"
    ON public.sos_requests FOR INSERT
    TO anon
    WITH CHECK (TRUE);

-- Allow authenticated users to submit SOS
CREATE POLICY "sos_requests_insert_authenticated"
    ON public.sos_requests FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Also fix victim_locations insert for anon users
DROP POLICY IF EXISTS "victim_locations_insert_any_auth" ON public.victim_locations;

CREATE POLICY "victim_locations_insert_anon"
    ON public.victim_locations FOR INSERT
    TO anon
    WITH CHECK (TRUE);

CREATE POLICY "victim_locations_insert_authenticated"
    ON public.victim_locations FOR INSERT
    TO authenticated
    WITH CHECK (TRUE);

-- Also ensure anonymous users can read active relief camps (for nearest camp lookup)
DROP POLICY IF EXISTS "relief_camps_select_anon" ON public.relief_camps;

CREATE POLICY "relief_camps_select_anon"
    ON public.relief_camps FOR SELECT
    TO anon
    USING (TRUE);
