-- ============================================================
-- Smart Flood Emergency Response and Relief Management System
-- Database Schema for Supabase PostgreSQL
-- File: schema.sql
-- ============================================================
-- SAFE TO RE-RUN: drops all tables first using CASCADE
-- NOTE: PostGIS removed for Supabase Free tier compatibility.
--       District coordinates stored as TEXT (e.g. "80.2707,13.0827")
-- ============================================================

-- Enable required extensions (uuid-ossp is always available on Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- DROP EXISTING OBJECTS (safe re-run)
-- ============================================================
DROP VIEW  IF EXISTS public.v_sos_requests  CASCADE;
DROP VIEW  IF EXISTS public.v_camp_summary  CASCADE;

DROP TABLE IF EXISTS public.audit_logs            CASCADE;
DROP TABLE IF EXISTS public.reports               CASCADE;
DROP TABLE IF EXISTS public.notifications         CASCADE;
DROP TABLE IF EXISTS public.donations             CASCADE;
DROP TABLE IF EXISTS public.resource_distribution CASCADE;
DROP TABLE IF EXISTS public.resources             CASCADE;
DROP TABLE IF EXISTS public.inventory             CASCADE;
DROP TABLE IF EXISTS public.rescue_history        CASCADE;
DROP TABLE IF EXISTS public.volunteer_assignments CASCADE;
DROP TABLE IF EXISTS public.victim_locations      CASCADE;
DROP TABLE IF EXISTS public.sos_requests          CASCADE;
DROP TABLE IF EXISTS public.volunteers            CASCADE;
DROP TABLE IF EXISTS public.families              CASCADE;
DROP TABLE IF EXISTS public.beneficiaries         CASCADE;
DROP TABLE IF EXISTS public.camp_capacity         CASCADE;
DROP TABLE IF EXISTS public.relief_camps          CASCADE;
DROP TABLE IF EXISTS public.flood_zones           CASCADE;
DROP TABLE IF EXISTS public.users                 CASCADE;
DROP TABLE IF EXISTS public.districts             CASCADE;
DROP TABLE IF EXISTS public.roles                 CASCADE;

-- ============================================================
-- TABLE 1: roles
-- ============================================================
CREATE TABLE public.roles (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE
                    CHECK (name IN ('super_admin', 'district_admin', 'camp_officer', 'volunteer', 'beneficiary')),
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.roles IS 'Application roles controlling access levels';

-- ============================================================
-- TABLE 2: districts
-- ============================================================
CREATE TABLE public.districts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    state       TEXT NOT NULL DEFAULT 'Tamil Nadu',
    code        TEXT NOT NULL UNIQUE,
    coordinates TEXT,                   -- stored as "longitude,latitude"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_districts_state ON public.districts(state);

COMMENT ON TABLE public.districts IS 'Administrative districts covered by the system';

-- ============================================================
-- TABLE 3: users  (extends auth.users)
-- ============================================================
CREATE TABLE public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   TEXT NOT NULL,
    phone       TEXT,
    avatar_url  TEXT,
    role        TEXT NOT NULL DEFAULT 'beneficiary'
                    REFERENCES public.roles(name) ON UPDATE CASCADE ON DELETE RESTRICT,
    district_id UUID REFERENCES public.districts(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role        ON public.users(role);
CREATE INDEX idx_users_district_id ON public.users(district_id);
CREATE INDEX idx_users_is_active   ON public.users(is_active);
CREATE INDEX idx_users_created_at  ON public.users(created_at);

COMMENT ON TABLE public.users IS 'Extended profile for every authenticated user';

-- ============================================================
-- TABLE 4: relief_camps
-- ============================================================
CREATE TABLE public.relief_camps (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              TEXT NOT NULL,
    district_id       UUID NOT NULL REFERENCES public.districts(id) ON DELETE RESTRICT,
    address           TEXT,
    latitude          NUMERIC(10, 7) NOT NULL,
    longitude         NUMERIC(10, 7) NOT NULL,
    max_capacity      INTEGER NOT NULL CHECK (max_capacity > 0),
    current_occupancy INTEGER NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
    beds_total        INTEGER NOT NULL DEFAULT 0 CHECK (beds_total >= 0),
    beds_available    INTEGER NOT NULL DEFAULT 0 CHECK (beds_available >= 0),
    has_electricity   BOOLEAN NOT NULL DEFAULT FALSE,
    has_water         BOOLEAN NOT NULL DEFAULT FALSE,
    has_medical       BOOLEAN NOT NULL DEFAULT FALSE,
    contact_name      TEXT,
    contact_phone     TEXT,
    status            TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'full', 'closed')),
    established_date  DATE,
    officer_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_occupancy_capacity CHECK (current_occupancy <= max_capacity),
    CONSTRAINT chk_beds_available     CHECK (beds_available <= beds_total)
);

CREATE INDEX idx_relief_camps_district_id ON public.relief_camps(district_id);
CREATE INDEX idx_relief_camps_status      ON public.relief_camps(status);
CREATE INDEX idx_relief_camps_officer_id  ON public.relief_camps(officer_id);
CREATE INDEX idx_relief_camps_created_at  ON public.relief_camps(created_at);

COMMENT ON TABLE public.relief_camps IS 'Physical relief camps where displaced persons are sheltered';

-- ============================================================
-- TABLE 5: camp_capacity
-- ============================================================
CREATE TABLE public.camp_capacity (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camp_id         UUID NOT NULL REFERENCES public.relief_camps(id) ON DELETE CASCADE,
    date            DATE NOT NULL DEFAULT CURRENT_DATE,
    beds_available  INTEGER NOT NULL DEFAULT 0 CHECK (beds_available >= 0),
    food_packets    INTEGER NOT NULL DEFAULT 0 CHECK (food_packets >= 0),
    water_liters    NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (water_liters >= 0),
    medical_kits    INTEGER NOT NULL DEFAULT 0 CHECK (medical_kits >= 0),
    blankets        INTEGER NOT NULL DEFAULT 0 CHECK (blankets >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (camp_id, date)
);

CREATE INDEX idx_camp_capacity_camp_id    ON public.camp_capacity(camp_id);
CREATE INDEX idx_camp_capacity_date       ON public.camp_capacity(date);
CREATE INDEX idx_camp_capacity_created_at ON public.camp_capacity(created_at);

COMMENT ON TABLE public.camp_capacity IS 'Daily snapshot of camp resource availability';

-- ============================================================
-- TABLE 6: beneficiaries
-- ============================================================
CREATE TABLE public.beneficiaries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES public.users(id) ON DELETE SET NULL,
    aadhaar_number      TEXT UNIQUE,
    blood_group         TEXT CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown')),
    medical_conditions  TEXT,
    disability          TEXT,
    is_pregnant         BOOLEAN NOT NULL DEFAULT FALSE,
    current_camp_id     UUID REFERENCES public.relief_camps(id) ON DELETE SET NULL,
    shelter_status      TEXT NOT NULL DEFAULT 'at_home'
                            CHECK (shelter_status IN ('at_home','at_camp','missing','rescued')),
    registration_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    qr_code_data        TEXT UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_beneficiaries_user_id    ON public.beneficiaries(user_id);
CREATE INDEX idx_beneficiaries_camp_id    ON public.beneficiaries(current_camp_id);
CREATE INDEX idx_beneficiaries_status     ON public.beneficiaries(shelter_status);
CREATE INDEX idx_beneficiaries_created_at ON public.beneficiaries(created_at);

COMMENT ON TABLE public.beneficiaries IS 'Individuals who receive emergency relief services';

-- ============================================================
-- TABLE 7: families
-- ============================================================
CREATE TABLE public.families (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_head_id  UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
    member_name     TEXT NOT NULL,
    age             INTEGER CHECK (age >= 0 AND age <= 150),
    gender          TEXT CHECK (gender IN ('male','female','other','prefer_not_to_say')),
    relationship    TEXT NOT NULL,
    medical_notes   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_families_family_head_id ON public.families(family_head_id);
CREATE INDEX idx_families_created_at     ON public.families(created_at);

COMMENT ON TABLE public.families IS 'Family members linked to a beneficiary (family head)';

-- ============================================================
-- TABLE 8: volunteers
-- ============================================================
CREATE TABLE public.volunteers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    district_id     UUID NOT NULL REFERENCES public.districts(id) ON DELETE RESTRICT,
    skills          TEXT[],
    vehicle_type    TEXT,
    is_available    BOOLEAN NOT NULL DEFAULT TRUE,
    current_lat     NUMERIC(10, 7),
    current_lng     NUMERIC(10, 7),
    total_missions  INTEGER NOT NULL DEFAULT 0 CHECK (total_missions >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_volunteers_user_id      ON public.volunteers(user_id);
CREATE INDEX idx_volunteers_district_id  ON public.volunteers(district_id);
CREATE INDEX idx_volunteers_is_available ON public.volunteers(is_available);
CREATE INDEX idx_volunteers_created_at   ON public.volunteers(created_at);

COMMENT ON TABLE public.volunteers IS 'Registered volunteers with skills and real-time location';

-- ============================================================
-- TABLE 9: sos_requests
-- ============================================================
CREATE TABLE public.sos_requests (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id        UUID REFERENCES public.beneficiaries(id) ON DELETE SET NULL,
    reporter_name         TEXT,
    reporter_phone        TEXT,
    latitude              NUMERIC(10, 7) NOT NULL,
    longitude             NUMERIC(10, 7) NOT NULL,
    address               TEXT,
    accuracy              NUMERIC(8, 2),
    emergency_type        TEXT NOT NULL,
    emergency_level       INTEGER NOT NULL DEFAULT 3
                              CHECK (emergency_level BETWEEN 1 AND 5),
    description           TEXT,
    image_url             TEXT,
    battery_level         INTEGER CHECK (battery_level BETWEEN 0 AND 100),
    status                TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','assigned','in_progress','rescued','cancelled')),
    assigned_volunteer_id UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sos_requests_beneficiary_id        ON public.sos_requests(beneficiary_id);
CREATE INDEX idx_sos_requests_status                ON public.sos_requests(status);
CREATE INDEX idx_sos_requests_assigned_volunteer_id ON public.sos_requests(assigned_volunteer_id);
CREATE INDEX idx_sos_requests_emergency_level       ON public.sos_requests(emergency_level);
CREATE INDEX idx_sos_requests_created_at            ON public.sos_requests(created_at);

COMMENT ON TABLE public.sos_requests IS 'Emergency rescue requests from victims';

-- ============================================================
-- TABLE 10: victim_locations
-- ============================================================
CREATE TABLE public.victim_locations (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sos_request_id  UUID NOT NULL REFERENCES public.sos_requests(id) ON DELETE CASCADE,
    latitude        NUMERIC(10, 7) NOT NULL,
    longitude       NUMERIC(10, 7) NOT NULL,
    accuracy        NUMERIC(8, 2),
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_victim_locations_sos_request_id ON public.victim_locations(sos_request_id);
CREATE INDEX idx_victim_locations_recorded_at    ON public.victim_locations(recorded_at);

COMMENT ON TABLE public.victim_locations IS 'GPS breadcrumb trail for active SOS requests';

-- ============================================================
-- TABLE 11: volunteer_assignments
-- ============================================================
CREATE TABLE public.volunteer_assignments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sos_request_id  UUID NOT NULL REFERENCES public.sos_requests(id) ON DELETE CASCADE,
    volunteer_id    UUID NOT NULL REFERENCES public.volunteers(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    route_data      JSONB,
    distance_km     NUMERIC(8, 2),
    eta_minutes     INTEGER,
    status          TEXT NOT NULL DEFAULT 'assigned'
                        CHECK (status IN ('assigned','accepted','rejected','completed'))
);

CREATE INDEX idx_volunteer_assignments_sos_request_id ON public.volunteer_assignments(sos_request_id);
CREATE INDEX idx_volunteer_assignments_volunteer_id   ON public.volunteer_assignments(volunteer_id);
CREATE INDEX idx_volunteer_assignments_status         ON public.volunteer_assignments(status);
CREATE INDEX idx_volunteer_assignments_assigned_at    ON public.volunteer_assignments(assigned_at);

COMMENT ON TABLE public.volunteer_assignments IS 'Assignment of volunteers to SOS rescue operations';

-- ============================================================
-- TABLE 12: rescue_history
-- ============================================================
CREATE TABLE public.rescue_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sos_request_id  UUID NOT NULL REFERENCES public.sos_requests(id) ON DELETE RESTRICT,
    volunteer_id    UUID REFERENCES public.volunteers(id) ON DELETE SET NULL,
    beneficiary_id  UUID REFERENCES public.beneficiaries(id) ON DELETE SET NULL,
    rescued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    camp_id         UUID REFERENCES public.relief_camps(id) ON DELETE SET NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rescue_history_sos_request_id ON public.rescue_history(sos_request_id);
CREATE INDEX idx_rescue_history_volunteer_id   ON public.rescue_history(volunteer_id);
CREATE INDEX idx_rescue_history_beneficiary_id ON public.rescue_history(beneficiary_id);
CREATE INDEX idx_rescue_history_camp_id        ON public.rescue_history(camp_id);
CREATE INDEX idx_rescue_history_rescued_at     ON public.rescue_history(rescued_at);

COMMENT ON TABLE public.rescue_history IS 'Completed rescue records for audit and reporting';

-- ============================================================
-- TABLE 13: inventory
-- ============================================================
CREATE TABLE public.inventory (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camp_id             UUID NOT NULL REFERENCES public.relief_camps(id) ON DELETE CASCADE,
    item_name           TEXT NOT NULL,
    category            TEXT NOT NULL,
    unit                TEXT NOT NULL,
    total_received      INTEGER NOT NULL DEFAULT 0 CHECK (total_received >= 0),
    total_distributed   INTEGER NOT NULL DEFAULT 0 CHECK (total_distributed >= 0),
    current_stock       INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_threshold       INTEGER NOT NULL DEFAULT 10 CHECK (min_threshold >= 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (camp_id, item_name),
    CONSTRAINT chk_stock_consistency CHECK (current_stock = total_received - total_distributed)
);

CREATE INDEX idx_inventory_camp_id    ON public.inventory(camp_id);
CREATE INDEX idx_inventory_category   ON public.inventory(category);
CREATE INDEX idx_inventory_created_at ON public.inventory(created_at);

COMMENT ON TABLE public.inventory IS 'Current stock levels per camp for all relief items';

-- ============================================================
-- TABLE 14: resources
-- ============================================================
CREATE TABLE public.resources (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL UNIQUE,
    category    TEXT NOT NULL,
    unit        TEXT NOT NULL,
    description TEXT
);

COMMENT ON TABLE public.resources IS 'Master list of resource types that can be distributed';

-- ============================================================
-- TABLE 15: resource_distribution
-- ============================================================
CREATE TABLE public.resource_distribution (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_id    UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE RESTRICT,
    camp_id           UUID NOT NULL REFERENCES public.relief_camps(id) ON DELETE RESTRICT,
    distributed_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
    distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    items             JSONB NOT NULL DEFAULT '[]'::jsonb,
    qr_scanned        BOOLEAN NOT NULL DEFAULT FALSE,
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resource_distribution_beneficiary_id    ON public.resource_distribution(beneficiary_id);
CREATE INDEX idx_resource_distribution_camp_id           ON public.resource_distribution(camp_id);
CREATE INDEX idx_resource_distribution_distributed_by    ON public.resource_distribution(distributed_by);
CREATE INDEX idx_resource_distribution_distribution_date ON public.resource_distribution(distribution_date);
CREATE INDEX idx_resource_distribution_created_at        ON public.resource_distribution(created_at);

COMMENT ON TABLE public.resource_distribution IS 'Records every distribution event to a beneficiary';

-- ============================================================
-- TABLE 16: donations
-- ============================================================
CREATE TABLE public.donations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    donor_name    TEXT NOT NULL,
    donor_email   TEXT,
    donor_phone   TEXT,
    donor_type    TEXT NOT NULL DEFAULT 'individual'
                      CHECK (donor_type IN ('individual','ngo','corporate')),
    donation_type TEXT NOT NULL
                      CHECK (donation_type IN ('cash','food','medicines','blankets','clothes','other')),
    amount        NUMERIC(14, 2),
    description   TEXT,
    district_id   UUID REFERENCES public.districts(id) ON DELETE SET NULL,
    status        TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','received','delivered')),
    approved_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_donations_district_id ON public.donations(district_id);
CREATE INDEX idx_donations_status      ON public.donations(status);
CREATE INDEX idx_donations_donor_type  ON public.donations(donor_type);
CREATE INDEX idx_donations_created_at  ON public.donations(created_at);

COMMENT ON TABLE public.donations IS 'Donations from individuals, NGOs and corporates';

-- ============================================================
-- TABLE 17: notifications
-- ============================================================
CREATE TABLE public.notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    data        JSONB DEFAULT '{}'::jsonb,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id    ON public.notifications(user_id);
CREATE INDEX idx_notifications_type       ON public.notifications(type);
CREATE INDEX idx_notifications_is_read    ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

COMMENT ON TABLE public.notifications IS 'In-app notifications; user_id NULL means system broadcast';

-- ============================================================
-- TABLE 18: reports
-- ============================================================
CREATE TABLE public.reports (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_type   TEXT NOT NULL,
    generated_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
    district_id   UUID REFERENCES public.districts(id) ON DELETE SET NULL,
    date_from     DATE,
    date_to       DATE,
    file_url      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_report_dates CHECK (date_from IS NULL OR date_to IS NULL OR date_from <= date_to)
);

CREATE INDEX idx_reports_generated_by ON public.reports(generated_by);
CREATE INDEX idx_reports_district_id  ON public.reports(district_id);
CREATE INDEX idx_reports_report_type  ON public.reports(report_type);
CREATE INDEX idx_reports_created_at   ON public.reports(created_at);

COMMENT ON TABLE public.reports IS 'Generated PDF/CSV reports for administrative review';

-- ============================================================
-- TABLE 19: audit_logs
-- ============================================================
CREATE TABLE public.audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    table_name  TEXT NOT NULL,
    record_id   TEXT,
    old_values  JSONB,
    new_values  JSONB,
    ip_address  INET,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id    ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action     ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id  ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail of all significant system actions';

-- ============================================================
-- TABLE 20: flood_zones
-- ============================================================
CREATE TABLE public.flood_zones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    district_id UUID NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    severity    TEXT NOT NULL DEFAULT 'medium'
                    CHECK (severity IN ('low','medium','high','critical')),
    coordinates JSONB NOT NULL DEFAULT '[]'::jsonb,
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_flood_zones_district_id ON public.flood_zones(district_id);
CREATE INDEX idx_flood_zones_severity    ON public.flood_zones(severity);
CREATE INDEX idx_flood_zones_updated_at  ON public.flood_zones(updated_at);

COMMENT ON TABLE public.flood_zones IS 'Geographic zones classified by flood risk level';

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- View: camp summary with district info
CREATE OR REPLACE VIEW public.v_camp_summary AS
SELECT
    rc.id,
    rc.name,
    rc.status,
    rc.current_occupancy,
    rc.max_capacity,
    ROUND((rc.current_occupancy::NUMERIC / NULLIF(rc.max_capacity, 0)) * 100, 1) AS occupancy_pct,
    rc.beds_available,
    rc.has_electricity,
    rc.has_water,
    rc.has_medical,
    rc.contact_name,
    rc.contact_phone,
    rc.latitude,
    rc.longitude,
    d.name  AS district_name,
    d.code  AS district_code,
    u.full_name AS officer_name,
    u.phone     AS officer_phone
FROM public.relief_camps rc
JOIN public.districts    d ON d.id = rc.district_id
LEFT JOIN public.users   u ON u.id = rc.officer_id;

-- View: SOS requests with enriched data
CREATE OR REPLACE VIEW public.v_sos_requests AS
SELECT
    s.id,
    s.reporter_name,
    s.reporter_phone,
    s.latitude,
    s.longitude,
    s.address,
    s.emergency_type,
    s.emergency_level,
    s.description,
    s.status,
    s.battery_level,
    s.created_at,
    s.updated_at,
    b.id              AS beneficiary_id,
    u.full_name       AS beneficiary_name,
    v.id              AS volunteer_id,
    vu.full_name      AS volunteer_name,
    vu.phone          AS volunteer_phone
FROM public.sos_requests      s
LEFT JOIN public.beneficiaries b  ON b.id = s.beneficiary_id
LEFT JOIN public.users         u  ON u.id = b.user_id
LEFT JOIN public.volunteers    v  ON v.id = s.assigned_volunteer_id
LEFT JOIN public.users         vu ON vu.id = v.user_id;
