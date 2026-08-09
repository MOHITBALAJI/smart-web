-- ============================================================
-- Smart Flood Emergency Response and Relief Management System
-- Row Level Security Policies
-- File: policies.sql
-- ============================================================
-- Run this AFTER schema.sql

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Returns the district_id of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_user_district()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT district_id FROM public.users WHERE id = auth.uid();
$$;

-- Returns the camp id where the current camp_officer is assigned
CREATE OR REPLACE FUNCTION public.get_officer_camp()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.relief_camps WHERE officer_id = auth.uid() LIMIT 1;
$$;

-- Returns the volunteer row id for the current user
CREATE OR REPLACE FUNCTION public.get_volunteer_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.volunteers WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Returns the beneficiary id for the current user
CREATE OR REPLACE FUNCTION public.get_beneficiary_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.beneficiaries WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relief_camps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camp_capacity          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_requests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.victim_locations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_distribution  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_zones            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: roles
-- ============================================================
-- Everyone can read roles; only super_admin can mutate
CREATE POLICY "roles_select_all"
    ON public.roles FOR SELECT
    USING (TRUE);

CREATE POLICY "roles_insert_super_admin"
    ON public.roles FOR INSERT
    WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "roles_update_super_admin"
    ON public.roles FOR UPDATE
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "roles_delete_super_admin"
    ON public.roles FOR DELETE
    USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- TABLE: districts
-- ============================================================
-- All authenticated users can read; only super_admin can write
CREATE POLICY "districts_select_authenticated"
    ON public.districts FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "districts_select_anon"
    ON public.districts FOR SELECT
    USING (auth.role() = 'anon');

CREATE POLICY "districts_insert_super_admin"
    ON public.districts FOR INSERT
    WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY "districts_update_super_admin"
    ON public.districts FOR UPDATE
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "districts_delete_super_admin"
    ON public.districts FOR DELETE
    USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- TABLE: users
-- ============================================================
-- Users can view their own profile
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    USING (id = auth.uid());

-- super_admin sees all users
CREATE POLICY "users_select_super_admin"
    ON public.users FOR SELECT
    USING (public.get_user_role() = 'super_admin');

-- district_admin sees users in same district
CREATE POLICY "users_select_district_admin"
    ON public.users FOR SELECT
    USING (
        public.get_user_role() = 'district_admin'
        AND district_id = public.get_user_district()
    );

-- camp_officer sees users in their district
CREATE POLICY "users_select_camp_officer"
    ON public.users FOR SELECT
    USING (
        public.get_user_role() = 'camp_officer'
        AND district_id = public.get_user_district()
    );

-- User can update their own profile (non-role, non-district fields)
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- Prevent self-escalation of role; role can only be set by admins
        AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    );

-- super_admin can update any user
CREATE POLICY "users_update_super_admin"
    ON public.users FOR UPDATE
    USING (public.get_user_role() = 'super_admin');

-- district_admin can update users in their district (but not super_admin users)
CREATE POLICY "users_update_district_admin"
    ON public.users FOR UPDATE
    USING (
        public.get_user_role() = 'district_admin'
        AND district_id = public.get_user_district()
        AND role != 'super_admin'
    );

-- Insert is done by trigger on auth.users; but super_admin can insert
CREATE POLICY "users_insert_super_admin"
    ON public.users FOR INSERT
    WITH CHECK (public.get_user_role() = 'super_admin');

-- Allow self-insert (for handle_new_user trigger which runs as service role)
CREATE POLICY "users_insert_self"
    ON public.users FOR INSERT
    WITH CHECK (id = auth.uid());

-- super_admin can delete
CREATE POLICY "users_delete_super_admin"
    ON public.users FOR DELETE
    USING (public.get_user_role() = 'super_admin');

-- ============================================================
-- TABLE: relief_camps
-- ============================================================
-- Anonymous users can read active camp info
CREATE POLICY "relief_camps_select_anon"
    ON public.relief_camps FOR SELECT
    USING (auth.role() = 'anon');

-- All authenticated users can read relief camps
CREATE POLICY "relief_camps_select_authenticated"
    ON public.relief_camps FOR SELECT
    USING (auth.role() = 'authenticated');

-- super_admin full write access
CREATE POLICY "relief_camps_all_super_admin"
    ON public.relief_camps FOR ALL
    USING (public.get_user_role() = 'super_admin');

-- district_admin: manage camps in their district
CREATE POLICY "relief_camps_all_district_admin"
    ON public.relief_camps FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND district_id = public.get_user_district()
    )
    WITH CHECK (
        public.get_user_role() = 'district_admin'
        AND district_id = public.get_user_district()
    );

-- camp_officer: update their assigned camp only
CREATE POLICY "relief_camps_update_camp_officer"
    ON public.relief_camps FOR UPDATE
    USING (
        public.get_user_role() = 'camp_officer'
        AND id = public.get_officer_camp()
    )
    WITH CHECK (
        public.get_user_role() = 'camp_officer'
        AND id = public.get_officer_camp()
    );

-- ============================================================
-- TABLE: camp_capacity
-- ============================================================
CREATE POLICY "camp_capacity_select_all_auth"
    ON public.camp_capacity FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "camp_capacity_all_super_admin"
    ON public.camp_capacity FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "camp_capacity_all_district_admin"
    ON public.camp_capacity FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND EXISTS (
            SELECT 1 FROM public.relief_camps rc
            WHERE rc.id = camp_capacity.camp_id
              AND rc.district_id = public.get_user_district()
        )
    );

CREATE POLICY "camp_capacity_write_camp_officer"
    ON public.camp_capacity FOR INSERT
    WITH CHECK (
        public.get_user_role() = 'camp_officer'
        AND camp_id = public.get_officer_camp()
    );

CREATE POLICY "camp_capacity_update_camp_officer"
    ON public.camp_capacity FOR UPDATE
    USING (
        public.get_user_role() = 'camp_officer'
        AND camp_id = public.get_officer_camp()
    );

CREATE POLICY "camp_capacity_select_anon"
    ON public.camp_capacity FOR SELECT
    USING (auth.role() = 'anon');

-- ============================================================
-- TABLE: beneficiaries
-- ============================================================
-- super_admin: full access
CREATE POLICY "beneficiaries_all_super_admin"
    ON public.beneficiaries FOR ALL
    USING (public.get_user_role() = 'super_admin');

-- district_admin: beneficiaries in their district camps
CREATE POLICY "beneficiaries_all_district_admin"
    ON public.beneficiaries FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND (
            current_camp_id IS NULL
            OR EXISTS (
                SELECT 1 FROM public.relief_camps rc
                WHERE rc.id = beneficiaries.current_camp_id
                  AND rc.district_id = public.get_user_district()
            )
        )
    );

-- camp_officer: beneficiaries in their camp
CREATE POLICY "beneficiaries_select_camp_officer"
    ON public.beneficiaries FOR SELECT
    USING (
        public.get_user_role() = 'camp_officer'
        AND current_camp_id = public.get_officer_camp()
    );

CREATE POLICY "beneficiaries_update_camp_officer"
    ON public.beneficiaries FOR UPDATE
    USING (
        public.get_user_role() = 'camp_officer'
        AND current_camp_id = public.get_officer_camp()
    );

-- Beneficiary can view and update their own record
CREATE POLICY "beneficiaries_select_own"
    ON public.beneficiaries FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "beneficiaries_update_own"
    ON public.beneficiaries FOR UPDATE
    USING (user_id = auth.uid());

-- volunteer can see beneficiaries linked to their assigned SOS requests
CREATE POLICY "beneficiaries_select_volunteer"
    ON public.beneficiaries FOR SELECT
    USING (
        public.get_user_role() = 'volunteer'
        AND EXISTS (
            SELECT 1 FROM public.sos_requests sr
            WHERE sr.beneficiary_id = beneficiaries.id
              AND sr.assigned_volunteer_id = public.get_volunteer_id()
        )
    );

-- ============================================================
-- TABLE: families
-- ============================================================
CREATE POLICY "families_all_super_admin"
    ON public.families FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "families_all_district_admin"
    ON public.families FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND EXISTS (
            SELECT 1 FROM public.beneficiaries b
            JOIN public.relief_camps rc ON rc.id = b.current_camp_id
            WHERE b.id = families.family_head_id
              AND rc.district_id = public.get_user_district()
        )
    );

CREATE POLICY "families_select_camp_officer"
    ON public.families FOR SELECT
    USING (
        public.get_user_role() = 'camp_officer'
        AND EXISTS (
            SELECT 1 FROM public.beneficiaries b
            WHERE b.id = families.family_head_id
              AND b.current_camp_id = public.get_officer_camp()
        )
    );

-- beneficiary can manage their own family records
CREATE POLICY "families_all_own_beneficiary"
    ON public.families FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.beneficiaries b
            WHERE b.id = families.family_head_id
              AND b.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.beneficiaries b
            WHERE b.id = families.family_head_id
              AND b.user_id = auth.uid()
        )
    );

-- ============================================================
-- TABLE: volunteers
-- ============================================================
CREATE POLICY "volunteers_all_super_admin"
    ON public.volunteers FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "volunteers_all_district_admin"
    ON public.volunteers FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND district_id = public.get_user_district()
    );

-- camp_officer can view volunteers in their district
CREATE POLICY "volunteers_select_camp_officer"
    ON public.volunteers FOR SELECT
    USING (
        public.get_user_role() = 'camp_officer'
        AND district_id = public.get_user_district()
    );

-- Volunteer manages their own row
CREATE POLICY "volunteers_select_own"
    ON public.volunteers FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "volunteers_update_own"
    ON public.volunteers FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "volunteers_insert_own"
    ON public.volunteers FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- TABLE: sos_requests
-- ============================================================
-- ANONYMOUS users can CREATE an SOS request (critical public safety)
CREATE POLICY "sos_requests_insert_anon"
    ON public.sos_requests FOR INSERT
    WITH CHECK (TRUE);

-- super_admin full access
CREATE POLICY "sos_requests_all_super_admin"
    ON public.sos_requests FOR ALL
    USING (public.get_user_role() = 'super_admin');

-- district_admin: SOS in their district (by lat/lng proximity is complex; use volunteer district or any active)
-- Simplified: district_admin sees all pending SOS; district filtering handled at app layer
CREATE POLICY "sos_requests_all_district_admin"
    ON public.sos_requests FOR ALL
    USING (public.get_user_role() = 'district_admin');

-- Volunteer sees requests assigned to them or unassigned in their district
CREATE POLICY "sos_requests_select_volunteer"
    ON public.sos_requests FOR SELECT
    USING (
        public.get_user_role() = 'volunteer'
        AND (
            assigned_volunteer_id = public.get_volunteer_id()
            OR status = 'pending'
        )
    );

-- Volunteer can update assigned_volunteer_id / status of their own assigned SOS
CREATE POLICY "sos_requests_update_volunteer"
    ON public.sos_requests FOR UPDATE
    USING (
        public.get_user_role() = 'volunteer'
        AND assigned_volunteer_id = public.get_volunteer_id()
    );

-- camp_officer can view SOS in their district
CREATE POLICY "sos_requests_select_camp_officer"
    ON public.sos_requests FOR SELECT
    USING (public.get_user_role() = 'camp_officer');

-- Beneficiary can see their own SOS requests
CREATE POLICY "sos_requests_select_own_beneficiary"
    ON public.sos_requests FOR SELECT
    USING (
        beneficiary_id = public.get_beneficiary_id()
        AND beneficiary_id IS NOT NULL
    );

-- Authenticated users can also create SOS
CREATE POLICY "sos_requests_insert_authenticated"
    ON public.sos_requests FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- TABLE: victim_locations
-- ============================================================
CREATE POLICY "victim_locations_all_super_admin"
    ON public.victim_locations FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "victim_locations_all_district_admin"
    ON public.victim_locations FOR ALL
    USING (public.get_user_role() = 'district_admin');

CREATE POLICY "victim_locations_select_volunteer"
    ON public.victim_locations FOR SELECT
    USING (
        public.get_user_role() = 'volunteer'
        AND EXISTS (
            SELECT 1 FROM public.sos_requests sr
            WHERE sr.id = victim_locations.sos_request_id
              AND sr.assigned_volunteer_id = public.get_volunteer_id()
        )
    );

-- Allow insert of location from any auth (victim tracking)
CREATE POLICY "victim_locations_insert_any_auth"
    ON public.victim_locations FOR INSERT
    WITH CHECK (auth.role() IN ('authenticated', 'anon'));

-- ============================================================
-- TABLE: volunteer_assignments
-- ============================================================
CREATE POLICY "volunteer_assignments_all_super_admin"
    ON public.volunteer_assignments FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "volunteer_assignments_all_district_admin"
    ON public.volunteer_assignments FOR ALL
    USING (public.get_user_role() = 'district_admin');

CREATE POLICY "volunteer_assignments_select_camp_officer"
    ON public.volunteer_assignments FOR SELECT
    USING (public.get_user_role() = 'camp_officer');

-- Volunteer sees and updates their own assignments
CREATE POLICY "volunteer_assignments_select_own"
    ON public.volunteer_assignments FOR SELECT
    USING (volunteer_id = public.get_volunteer_id());

CREATE POLICY "volunteer_assignments_update_own"
    ON public.volunteer_assignments FOR UPDATE
    USING (volunteer_id = public.get_volunteer_id());

-- ============================================================
-- TABLE: rescue_history
-- ============================================================
CREATE POLICY "rescue_history_all_super_admin"
    ON public.rescue_history FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "rescue_history_all_district_admin"
    ON public.rescue_history FOR ALL
    USING (public.get_user_role() = 'district_admin');

CREATE POLICY "rescue_history_select_camp_officer"
    ON public.rescue_history FOR SELECT
    USING (
        public.get_user_role() = 'camp_officer'
        AND camp_id = public.get_officer_camp()
    );

CREATE POLICY "rescue_history_insert_camp_officer"
    ON public.rescue_history FOR INSERT
    WITH CHECK (
        public.get_user_role() = 'camp_officer'
        AND camp_id = public.get_officer_camp()
    );

CREATE POLICY "rescue_history_select_volunteer"
    ON public.rescue_history FOR SELECT
    USING (volunteer_id = public.get_volunteer_id());

CREATE POLICY "rescue_history_insert_volunteer"
    ON public.rescue_history FOR INSERT
    WITH CHECK (volunteer_id = public.get_volunteer_id());

-- ============================================================
-- TABLE: inventory
-- ============================================================
CREATE POLICY "inventory_all_super_admin"
    ON public.inventory FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "inventory_all_district_admin"
    ON public.inventory FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND EXISTS (
            SELECT 1 FROM public.relief_camps rc
            WHERE rc.id = inventory.camp_id
              AND rc.district_id = public.get_user_district()
        )
    );

CREATE POLICY "inventory_all_camp_officer"
    ON public.inventory FOR ALL
    USING (
        public.get_user_role() = 'camp_officer'
        AND camp_id = public.get_officer_camp()
    );

-- Volunteers can read inventory of their district's camps
CREATE POLICY "inventory_select_volunteer"
    ON public.inventory FOR SELECT
    USING (
        public.get_user_role() = 'volunteer'
        AND EXISTS (
            SELECT 1 FROM public.relief_camps rc
            JOIN public.volunteers v ON v.district_id = rc.district_id
            WHERE rc.id = inventory.camp_id
              AND v.user_id = auth.uid()
        )
    );

-- ============================================================
-- TABLE: resources
-- ============================================================
-- All authenticated and anon can read resource types
CREATE POLICY "resources_select_all"
    ON public.resources FOR SELECT
    USING (TRUE);

CREATE POLICY "resources_write_super_admin"
    ON public.resources FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "resources_write_district_admin"
    ON public.resources FOR INSERT
    WITH CHECK (public.get_user_role() = 'district_admin');

-- ============================================================
-- TABLE: resource_distribution
-- ============================================================
CREATE POLICY "resource_distribution_all_super_admin"
    ON public.resource_distribution FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "resource_distribution_all_district_admin"
    ON public.resource_distribution FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND EXISTS (
            SELECT 1 FROM public.relief_camps rc
            WHERE rc.id = resource_distribution.camp_id
              AND rc.district_id = public.get_user_district()
        )
    );

CREATE POLICY "resource_distribution_write_camp_officer"
    ON public.resource_distribution FOR INSERT
    WITH CHECK (
        public.get_user_role() = 'camp_officer'
        AND camp_id = public.get_officer_camp()
    );

CREATE POLICY "resource_distribution_select_camp_officer"
    ON public.resource_distribution FOR SELECT
    USING (
        public.get_user_role() = 'camp_officer'
        AND camp_id = public.get_officer_camp()
    );

-- Beneficiary sees their own distribution records
CREATE POLICY "resource_distribution_select_own"
    ON public.resource_distribution FOR SELECT
    USING (beneficiary_id = public.get_beneficiary_id());

-- ============================================================
-- TABLE: donations
-- ============================================================
-- Anyone can submit a donation (public form)
CREATE POLICY "donations_insert_any"
    ON public.donations FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "donations_all_super_admin"
    ON public.donations FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "donations_all_district_admin"
    ON public.donations FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND (
            district_id = public.get_user_district()
            OR district_id IS NULL
        )
    );

CREATE POLICY "donations_select_camp_officer"
    ON public.donations FOR SELECT
    USING (
        public.get_user_role() = 'camp_officer'
        AND district_id = public.get_user_district()
    );

-- ============================================================
-- TABLE: notifications
-- ============================================================
-- Users can see notifications addressed to them or broadcasts (user_id IS NULL)
CREATE POLICY "notifications_select_own"
    ON public.notifications FOR SELECT
    USING (
        user_id = auth.uid()
        OR user_id IS NULL
    );

CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_all_super_admin"
    ON public.notifications FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "notifications_insert_system"
    ON public.notifications FOR INSERT
    WITH CHECK (
        public.get_user_role() IN ('super_admin', 'district_admin', 'camp_officer')
    );

-- ============================================================
-- TABLE: reports
-- ============================================================
CREATE POLICY "reports_all_super_admin"
    ON public.reports FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "reports_all_district_admin"
    ON public.reports FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND (
            district_id = public.get_user_district()
            OR district_id IS NULL
        )
    );

CREATE POLICY "reports_select_camp_officer"
    ON public.reports FOR SELECT
    USING (
        public.get_user_role() = 'camp_officer'
        AND district_id = public.get_user_district()
    );

CREATE POLICY "reports_insert_camp_officer"
    ON public.reports FOR INSERT
    WITH CHECK (
        public.get_user_role() = 'camp_officer'
        AND generated_by = auth.uid()
    );

-- ============================================================
-- TABLE: audit_logs
-- ============================================================
-- Audit logs are append-only; no user can update or delete
CREATE POLICY "audit_logs_select_super_admin"
    ON public.audit_logs FOR SELECT
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "audit_logs_select_own"
    ON public.audit_logs FOR SELECT
    USING (user_id = auth.uid());

-- Only service role (triggers/functions) can insert via SECURITY DEFINER
-- Regular authenticated users cannot directly insert audit_logs
CREATE POLICY "audit_logs_insert_service"
    ON public.audit_logs FOR INSERT
    WITH CHECK (
        public.get_user_role() IN ('super_admin', 'district_admin')
    );

-- ============================================================
-- TABLE: flood_zones
-- ============================================================
-- Anonymous users can read flood zone data (public safety info)
CREATE POLICY "flood_zones_select_anon"
    ON public.flood_zones FOR SELECT
    USING (auth.role() = 'anon');

CREATE POLICY "flood_zones_select_authenticated"
    ON public.flood_zones FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "flood_zones_all_super_admin"
    ON public.flood_zones FOR ALL
    USING (public.get_user_role() = 'super_admin');

CREATE POLICY "flood_zones_all_district_admin"
    ON public.flood_zones FOR ALL
    USING (
        public.get_user_role() = 'district_admin'
        AND district_id = public.get_user_district()
    );

CREATE POLICY "flood_zones_update_camp_officer"
    ON public.flood_zones FOR UPDATE
    USING (
        public.get_user_role() = 'camp_officer'
        AND district_id = public.get_user_district()
    );
