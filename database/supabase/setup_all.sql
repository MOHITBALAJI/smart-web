-- ========================================================
-- 1. BASE DATABASE SCHEMA & ENUMS
-- ========================================================

-- Enable extension pgcrypto if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE public.app_role AS ENUM ('super_admin', 'camp_officer', 'volunteer', 'beneficiary');
CREATE TYPE public.camp_status AS ENUM ('active', 'full', 'closed', 'planned');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.resource_category AS ENUM ('food', 'water', 'clothes', 'medicine', 'blankets', 'hygiene', 'baby_supplies', 'other');
CREATE TYPE public.donation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'fulfilled');

-- Helper: updated_at trigger function
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- User Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('super_admin','camp_officer','volunteer'));
$$;

CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Auto Profile + Role on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'beneficiary');
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Camps
CREATE TABLE public.camps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  capacity INTEGER NOT NULL DEFAULT 0,
  current_occupancy INTEGER NOT NULL DEFAULT 0,
  medical_facility BOOLEAN NOT NULL DEFAULT false,
  contact_number TEXT,
  status public.camp_status NOT NULL DEFAULT 'active',
  officer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.camps TO authenticated;
GRANT SELECT ON public.camps TO anon;
GRANT ALL ON public.camps TO service_role;
ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camps readable" ON public.camps FOR SELECT USING (true);
CREATE POLICY "staff insert camps" ON public.camps FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'camp_officer'));
CREATE POLICY "staff update camps" ON public.camps FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'camp_officer'));
CREATE POLICY "admin delete camps" ON public.camps FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_camps_updated BEFORE UPDATE ON public.camps FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_camps_district ON public.camps(district);
CREATE INDEX idx_camps_status ON public.camps(status);

-- Families
CREATE TABLE public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_head_name TEXT NOT NULL,
  camp_id UUID REFERENCES public.camps(id) ON DELETE SET NULL,
  village TEXT,
  total_members INTEGER NOT NULL DEFAULT 1,
  contact_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.families TO authenticated;
GRANT ALL ON public.families TO service_role;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "families read staff" ON public.families FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "families write staff" ON public.families FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_families_updated BEFORE UPDATE ON public.families FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Beneficiaries
CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  photo_url TEXT,
  full_name TEXT NOT NULL,
  aadhaar TEXT UNIQUE,
  phone TEXT,
  gender TEXT,
  age INTEGER,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  village TEXT,
  district TEXT,
  medical_condition TEXT,
  disability BOOLEAN NOT NULL DEFAULT false,
  pregnancy BOOLEAN NOT NULL DEFAULT false,
  camp_id UUID REFERENCES public.camps(id) ON DELETE SET NULL,
  priority public.priority_level NOT NULL DEFAULT 'low',
  qr_code TEXT UNIQUE NOT NULL DEFAULT ('BEN-' || gen_random_uuid()::text),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficiaries TO authenticated;
GRANT ALL ON public.beneficiaries TO service_role;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "beneficiaries staff read" ON public.beneficiaries FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR user_id = auth.uid());
CREATE POLICY "beneficiaries staff write" ON public.beneficiaries FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_beneficiaries_updated BEFORE UPDATE ON public.beneficiaries FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_beneficiaries_camp ON public.beneficiaries(camp_id);
CREATE INDEX idx_beneficiaries_priority ON public.beneficiaries(priority);

-- Resources
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.resource_category NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unit',
  available_stock INTEGER NOT NULL DEFAULT 0,
  distributed_stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  supplier TEXT,
  expiry_date DATE,
  camp_id UUID REFERENCES public.camps(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources staff read" ON public.resources FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "resources staff write" ON public.resources FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER trg_resources_updated BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Distributions
CREATE TABLE public.distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
  camp_id UUID REFERENCES public.camps(id) ON DELETE SET NULL,
  volunteer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.distributions TO authenticated;
GRANT ALL ON public.distributions TO service_role;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "distributions read" ON public.distributions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.beneficiaries b WHERE b.id = beneficiary_id AND b.user_id = auth.uid()));
CREATE POLICY "distributions write staff" ON public.distributions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Distribution Items
CREATE TABLE public.distribution_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distribution_id UUID NOT NULL REFERENCES public.distributions(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.distribution_items TO authenticated;
GRANT ALL ON public.distribution_items TO service_role;
ALTER TABLE public.distribution_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dist_items read staff" ON public.distribution_items FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "dist_items write staff" ON public.distribution_items FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Auto-decrement inventory when distribution item added
CREATE OR REPLACE FUNCTION public.tg_apply_distribution()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.resources
     SET available_stock = available_stock - NEW.quantity,
          distributed_stock = distributed_stock + NEW.quantity
   WHERE id = NEW.resource_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_apply_distribution AFTER INSERT ON public.distribution_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_apply_distribution();

-- Donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT NOT NULL,
  donor_contact TEXT,
  resource_name TEXT NOT NULL,
  category public.resource_category NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status public.donation_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  camp_id UUID REFERENCES public.camps(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT SELECT, INSERT ON public.donations TO anon;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations public insert" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "donations staff read" ON public.donations FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "donations admin write" ON public.donations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'camp_officer'));
CREATE TRIGGER trg_donations_updated BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Resource Requests
CREATE TABLE public.resource_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id UUID NOT NULL REFERENCES public.camps(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES auth.users(id),
  category public.resource_category NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  priority public.priority_level NOT NULL DEFAULT 'medium',
  status public.request_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resource_requests TO authenticated;
GRANT ALL ON public.resource_requests TO service_role;
ALTER TABLE public.resource_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "req staff read" ON public.resource_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "req staff insert" ON public.resource_requests FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "req admin update" ON public.resource_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER trg_reqs_updated BEFORE UPDATE ON public.resource_requests FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif own read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "notif own update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif staff insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.is_staff(auth.uid()));

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "audit any insert" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.camps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.beneficiaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.distributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ========================================================
-- 2. SECURITY POLICY TWEAKS (TIGHTENING ACCESS)
-- ========================================================

-- Restrict execute on SECURITY DEFINER helpers so they can only be used from RLS/triggers
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_apply_distribution() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

-- Tighten public donation submissions: require the caller to be anon (unauthenticated wishlist form)
DROP POLICY IF EXISTS "donations public insert" ON public.donations;
CREATE POLICY "donations public insert"
  ON public.donations FOR INSERT TO anon
  WITH CHECK (status = 'pending' AND approved_by IS NULL);

CREATE POLICY "donations auth insert"
  ON public.donations FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND approved_by IS NULL);

-- Audit inserts should always be tied to the caller
DROP POLICY IF EXISTS "audit any insert" ON public.audit_logs;
CREATE POLICY "audit self insert"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());


-- ========================================================
-- 3. SUPPORT REQUESTS SCHEMA
-- ========================================================

CREATE TABLE IF NOT EXISTS public.support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES public.beneficiaries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('medical', 'food', 'shelter', 'clothing', 'other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
  response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_requests TO authenticated;
GRANT ALL ON public.support_requests TO service_role;

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Beneficiaries can read their own requests
CREATE POLICY "support_req_own_read" ON public.support_requests FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.beneficiaries b WHERE b.id = beneficiary_id AND b.user_id = auth.uid())
    OR public.is_staff(auth.uid())
  );

-- Beneficiaries can create their own requests
CREATE POLICY "support_req_own_insert" ON public.support_requests FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.beneficiaries b WHERE b.id = beneficiary_id AND b.user_id = auth.uid())
    OR public.is_staff(auth.uid())
  );

-- Staff can update (respond to) requests
CREATE POLICY "support_req_staff_update" ON public.support_requests FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_support_requests_updated BEFORE UPDATE ON public.support_requests
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Add to realtime publication if it doesn't already exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.support_requests;
  END IF;
EXCEPTION
  WHEN others THEN NULL;
END $$;


-- ========================================================
-- 4. AUTOMATED NOTIFICATION TRIGGERS
-- ========================================================

-- Trigger for low stock notification
CREATE OR REPLACE FUNCTION public.tg_notify_low_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.available_stock <= NEW.low_stock_threshold AND 
     (OLD.available_stock > OLD.low_stock_threshold OR TG_OP = 'INSERT') THEN
    INSERT INTO public.notifications (user_id, title, body, kind)
    SELECT ur.user_id, 
           'Low Stock Alert: ' || NEW.name,
           NEW.name || ' has only ' || NEW.available_stock || ' ' || NEW.unit || ' remaining (threshold: ' || NEW.low_stock_threshold || ')',
           'warning'
    FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'camp_officer');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER trg_notify_low_stock AFTER UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_low_stock();

-- Trigger for camp full notification
CREATE OR REPLACE FUNCTION public.tg_notify_camp_full()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.current_occupancy >= NEW.capacity AND 
     (OLD.current_occupancy < OLD.capacity) THEN
    INSERT INTO public.notifications (user_id, title, body, kind)
    SELECT ur.user_id,
           'Camp Full: ' || NEW.name,
           NEW.name || ' has reached capacity (' || NEW.capacity || '). Consider redirecting new arrivals.',
           'alert'
    FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'camp_officer');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER trg_notify_camp_full AFTER UPDATE ON public.camps
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_camp_full();

-- Trigger for new beneficiary notification  
CREATE OR REPLACE FUNCTION public.tg_notify_new_beneficiary()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, kind)
  SELECT ur.user_id,
         'New Beneficiary: ' || NEW.full_name,
         NEW.full_name || ' registered' || COALESCE(' at ' || (SELECT name FROM public.camps WHERE id = NEW.camp_id), '') || ' with priority: ' || NEW.priority,
         'info'
  FROM public.user_roles ur
  WHERE ur.role IN ('super_admin', 'camp_officer');
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER trg_notify_new_beneficiary AFTER INSERT ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_new_beneficiary();

-- Trigger for donation approved notification
CREATE OR REPLACE FUNCTION public.tg_notify_donation_approved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, body, kind)
    SELECT ur.user_id,
           'Donation Approved: ' || NEW.resource_name,
           NEW.quantity || ' units of ' || NEW.resource_name || ' from ' || NEW.donor_name || ' approved and added to inventory.',
           'success'
    FROM public.user_roles ur
    WHERE ur.role IN ('super_admin', 'camp_officer');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER trg_notify_donation_approved AFTER UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.tg_notify_donation_approved();


-- ========================================================
-- 5. VOLUNTEER ASSIGNMENTS & SHIFTS
-- ========================================================

-- Volunteer camp assignments
CREATE TABLE IF NOT EXISTS public.volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camp_id UUID NOT NULL REFERENCES public.camps(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id, camp_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_assignments TO authenticated;
GRANT ALL ON public.volunteer_assignments TO service_role;

ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "va_staff_read" ON public.volunteer_assignments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR volunteer_id = auth.uid());

CREATE POLICY "va_admin_write" ON public.volunteer_assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'camp_officer'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'camp_officer'));

-- Volunteer shifts
CREATE TABLE IF NOT EXISTS public.volunteer_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camp_id UUID NOT NULL REFERENCES public.camps(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_shifts TO authenticated;
GRANT ALL ON public.volunteer_shifts TO service_role;

ALTER TABLE public.volunteer_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vs_staff_read" ON public.volunteer_shifts FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR volunteer_id = auth.uid());

CREATE POLICY "vs_admin_write" ON public.volunteer_shifts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'camp_officer'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'camp_officer'));

-- Fix distribution_items read policy so beneficiary portal can see their items
DROP POLICY IF EXISTS "dist_items read staff" ON public.distribution_items;

CREATE POLICY "dist_items_access" ON public.distribution_items FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.distributions d
      JOIN public.beneficiaries b ON b.id = d.beneficiary_id
      WHERE d.id = distribution_id AND b.user_id = auth.uid()
    )
  );

-- Fix distribution_items write policy for staff
DROP POLICY IF EXISTS "dist_items write staff" ON public.distribution_items;
CREATE POLICY "dist_items_write" ON public.distribution_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));


-- ========================================================
-- 6. QUICK INQUIRY SEARCH HELPER (PUBLIC ACCESS)
-- ========================================================

-- Security definer function to allow public anonymous lookups of beneficiary safety status without login
CREATE OR REPLACE FUNCTION public.quick_inquiry_search(search_query TEXT)
RETURNS TABLE (
  full_name TEXT,
  camp_name TEXT,
  district TEXT,
  village TEXT,
  priority TEXT,
  is_safe BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Search by full name (case insensitive matching) or Aadhaar number or QR code
  RETURN QUERY
  SELECT 
    b.full_name,
    COALESCE(c.name, 'Out-of-camp') AS camp_name,
    COALESCE(c.district, b.district) AS district,
    b.village,
    b.priority::text,
    TRUE as is_safe
  FROM public.beneficiaries b
  LEFT JOIN public.camps c ON c.id = b.camp_id
  WHERE (b.full_name ILIKE '%' || search_query || '%' AND LENGTH(search_query) >= 3)
     OR b.aadhaar = search_query
     OR b.qr_code = search_query;
END; $$;

GRANT EXECUTE ON FUNCTION public.quick_inquiry_search(TEXT) TO anon, authenticated;


-- ========================================================
-- 7. SEED DATA (MOCK USERS, ROLES, INVENTORY, SEED RECORDS)
-- ========================================================

-- Clear existing public data to ensure a clean seed (cascade handles constraints)
TRUNCATE public.notifications, public.support_requests, public.audit_logs, 
         public.distribution_items, public.distributions, public.resources, 
         public.resource_requests, public.donations, public.beneficiaries, 
         public.families, public.volunteer_shifts, public.volunteer_assignments, 
         public.camps, public.user_roles, public.profiles CASCADE;

-- Insert Mock Users into auth.users (Temporary UUIDs)
-- Passwords will be hashed using bcrypt. Note: 'password123'
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud)
VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'admin@relief.gov.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Rajesh Kumar"}', now(), now(), 'authenticated', 'authenticated'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'officer1@relief.gov.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Latha Haridas"}', now(), now(), 'authenticated', 'authenticated'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'officer2@relief.gov.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Abraham Mathew"}', now(), now(), 'authenticated', 'authenticated'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'volunteer1@relief.gov.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Anjali Menon"}', now(), now(), 'authenticated', 'authenticated'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'volunteer2@relief.gov.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Siddharth Shah"}', now(), now(), 'authenticated', 'authenticated'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'beneficiary1@relief.gov.in', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mohan Lal"}', now(), now(), 'authenticated', 'authenticated');

-- Clean up auto-inserted roles from trigger to avoid conflicts
DELETE FROM public.user_roles;

-- Set User Roles
INSERT INTO public.user_roles (user_id, role) VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'super_admin'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'camp_officer'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'camp_officer'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'volunteer'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'volunteer'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'beneficiary');

-- Clear profiles created by trigger and recreate exactly as needed
DELETE FROM public.profiles;
INSERT INTO public.profiles (id, full_name, email, phone) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Rajesh Kumar', 'admin@relief.gov.in', '9876543210'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a-4b5c6d7e', 'Latha Haridas', 'officer1@relief.gov.in', '9876543211'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b-5c6d7e8f', 'Abraham Mathew', 'officer2@relief.gov.in', '9876543212'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Anjali Menon', 'volunteer1@relief.gov.in', '9876543213'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Siddharth Shah', 'volunteer2@relief.gov.in', '9876543214'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'Mohan Lal', 'beneficiary1@relief.gov.in', '9876543215');

-- Relief Camps
INSERT INTO public.camps (id, name, district, address, latitude, longitude, capacity, current_occupancy, medical_facility, contact_number, status, officer_id) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Aluva GHSS Relief Camp', 'Ernakulam', 'Govt Girls Higher Secondary School, Aluva, Ernakulam', 10.1076, 76.3488, 300, 120, true, '0484-2623456', 'active', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'),
  ('c2222222-2222-2222-2222-222222222222', 'Chengannur Town Hall Shelter', 'Alappuzha', 'Town Hall, Chengannur, Alappuzha', 9.3175, 76.6111, 200, 195, true, '0479-2452345', 'full', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'),
  ('c3333333-3333-3333-3333-333333333333', 'Chalakudy St. James Auditorium', 'Thrissur', 'St. James Church Compound, Chalakudy, Thrissur', 10.3117, 76.3353, 500, 320, false, '0480-2708899', 'active', NULL),
  ('c4444444-4444-4444-4444-444444444444', 'Kalpetta SKMJ School Camp', 'Wayanad', 'SKMJ High School, Kalpetta, Wayanad', 11.6053, 76.0831, 250, 45, true, '0493-6202233', 'active', NULL),
  ('c5555555-5555-5555-5555-555555555555', 'Adimali Govt School', 'Idukki', 'Govt High School, Adimali, Idukki', 10.0214, 76.9542, 150, 0, false, '0486-4222100', 'planned', NULL),
  ('c6666666-6666-6666-6666-666666666666', 'Kuttanad Community Hall', 'Alappuzha', 'Community Hall, Ramankary, Kuttanad', 9.4215, 76.4382, 100, 0, false, '0477-2702200', 'closed', NULL);

-- Volunteer Camp Assignments
INSERT INTO public.volunteer_assignments (volunteer_id, camp_id) VALUES
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'c1111111-1111-1111-1111-111111111111'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'c2222222-2222-2222-2222-222222222222');

-- Volunteer Shifts
INSERT INTO public.volunteer_shifts (volunteer_id, camp_id, shift_date, start_time, end_time, status) VALUES
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'c1111111-1111-1111-1111-111111111111', current_date, '08:00:00', '16:00:00', 'scheduled'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'c2222222-2222-2222-2222-222222222222', current_date, '16:00:00', '23:59:59', 'scheduled');

-- Families
INSERT INTO public.families (id, family_head_name, camp_id, village, total_members, contact_number) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'Mohan Lal', 'c1111111-1111-1111-1111-111111111111', 'Aluva East', 4, '9895012345'),
  ('f2222222-2222-2222-2222-222222222222', 'Rethamma Pillai', 'c2222222-2222-2222-2222-222222222222', 'Chengannur North', 3, '9447012345'),
  ('f3333333-3333-3333-3333-333333333333', 'Devassy Joseph', 'c3333333-3333-3333-3333-333333333333', 'Chalakudy West', 5, '9946012345'),
  ('f4444444-4444-4444-4444-444444444444', 'Kunhaman K.', 'c4444444-4444-4444-4444-444444444444', 'Meppadi', 2, '9845012345'),
  ('f5555555-5555-5555-5555-555555555555', 'Suresh Gopalan', 'c1111111-1111-1111-1111-111111111111', 'Desom', 3, '9746012345');

-- Beneficiaries
INSERT INTO public.beneficiaries (id, user_id, full_name, aadhaar, phone, gender, age, family_id, village, district, medical_condition, disability, pregnancy, camp_id, priority, qr_code) VALUES
  -- Mohan Lal & Family
  ('b1111111-1111-1111-1111-111111111111', 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c', 'Mohan Lal', '2345-6789-0123', '9895012345', 'male', 52, 'f1111111-1111-1111-1111-111111111111', 'Aluva East', 'Ernakulam', 'Diabetes', false, false, 'c1111111-1111-1111-1111-111111111111', 'medium', 'BEN-MOHANLAL'),
  ('b1111111-1111-1111-1111-111111111112', NULL, 'Sujatha Lal', '2345-6789-0124', '9895012346', 'female', 48, 'f1111111-1111-1111-1111-111111111111', 'Aluva East', 'Ernakulam', NULL, false, false, 'c1111111-1111-1111-1111-111111111111', 'low', 'BEN-SUJATHALAL'),
  ('b1111111-1111-1111-1111-111111111113', NULL, 'Arun Mohan', '2345-6789-0125', '9895012347', 'male', 22, 'f1111111-1111-1111-1111-111111111111', 'Aluva East', 'Ernakulam', NULL, false, false, 'c1111111-1111-1111-1111-111111111111', 'low', 'BEN-ARUNMOHAN'),
  ('b1111111-1111-1111-1111-111111111114', NULL, 'Kalyani Mohan', '2345-6789-0126', NULL, 'female', 12, 'f1111111-1111-1111-1111-111111111111', 'Aluva East', 'Ernakulam', 'Asthma', false, false, 'c1111111-1111-1111-1111-111111111111', 'high', 'BEN-KALYANIMOHAN'),
  
  -- Rethamma Pillai & Family
  ('b2222222-2222-2222-2222-222222222221', NULL, 'Rethamma Pillai', '3456-7890-1234', '9447012345', 'female', 72, 'f2222222-2222-2222-2222-222222222222', 'Chengannur North', 'Alappuzha', 'Hypertension, mobility assistance', true, false, 'c2222222-2222-2222-2222-222222222222', 'critical', 'BEN-RETHAMMA'),
  ('b2222222-2222-2222-2222-222222222222', NULL, 'Bindu Madhavan', '3456-7890-1235', '9447012346', 'female', 45, 'f2222222-2222-2222-2222-222222222222', 'Chengannur North', 'Alappuzha', NULL, false, false, 'c2222222-2222-2222-2222-222222222222', 'low', 'BEN-BINDU'),
  ('b2222222-2222-2222-2222-222222222223', NULL, 'Aswathy Madhavan', '3456-7890-1236', NULL, 'female', 23, 'f2222222-2222-2222-2222-222222222222', 'Chengannur North', 'Alappuzha', NULL, false, true, 'c2222222-2222-2222-2222-222222222222', 'critical', 'BEN-ASWATHY'),

  -- Devassy & Family
  ('b3333333-3333-3333-3333-333333333331', NULL, 'Devassy Joseph', '4567-8901-2345', '9946012345', 'male', 65, 'f3333333-3333-3333-3333-333333333333', 'Chalakudy West', 'Thrissur', 'Cardiac ailment', false, false, 'c3333333-3333-3333-3333-333333333333', 'high', 'BEN-DEVASSY'),
  ('b3333333-3333-3333-3333-333333333332', NULL, 'Mary Devassy', '4567-8901-2346', NULL, 'female', 58, 'f3333333-3333-3333-3333-333333333333', 'Chalakudy West', 'Thrissur', NULL, false, false, 'c3333333-3333-3333-3333-333333333333', 'low', 'BEN-MARY'),
  
  -- Unassigned / Individual
  ('b9999999-9999-9999-9999-999999999999', NULL, 'Balan K. P.', '5678-9012-3456', '9895989598', 'male', 34, NULL, 'Kadamakkudy', 'Ernakulam', 'Laceration on right leg', false, false, 'c1111111-1111-1111-1111-111111111111', 'medium', 'BEN-BALANKP');

-- Resources (Inventory)
INSERT INTO public.resources (id, name, category, unit, available_stock, distributed_stock, low_stock_threshold, supplier, expiry_date, camp_id) VALUES
  -- Ernakulam Camp
  ('81111111-1111-1111-1111-111111111111', 'Rice Bags (5kg)', 'food', 'pack', 150, 45, 20, 'Civil Supplies Corp', '2027-01-01', 'c1111111-1111-1111-1111-111111111111'),
  ('81111111-1111-1111-1111-111111111112', 'Drinking Water 1L Bottles', 'water', 'bottle', 12, 180, 50, 'Bisleri Kerala', '2026-12-01', 'c1111111-1111-1111-1111-111111111111'), -- Low stock
  ('81111111-1111-1111-1111-111111111113', 'First Aid Kits', 'medicine', 'kit', 35, 15, 10, 'District Medical Office', '2027-05-01', 'c1111111-1111-1111-1111-111111111111'),
  ('81111111-1111-1111-1111-111111111114', 'Blankets', 'blankets', 'piece', 80, 40, 15, 'Red Cross Society', NULL, 'c1111111-1111-1111-1111-111111111111'),
  ('81111111-1111-1111-1111-111111111115', 'Baby Diapers (Medium)', 'baby_supplies', 'packet', 5, 25, 10, 'Huggies India', '2028-10-01', 'c1111111-1111-1111-1111-111111111111'), -- Low stock

  -- Alappuzha Camp (Full)
  ('82222222-2222-2222-2222-222222222221', 'Wheat Flour (2kg)', 'food', 'pack', 200, 80, 30, 'Civil Supplies Corp', '2026-11-15', 'c2222222-2222-2222-2222-222222222222'),
  ('82222222-2222-2222-2222-222222222222', 'Insulin Vials', 'medicine', 'vial', 40, 10, 15, 'Public Health Center', '2026-08-30', 'c2222222-2222-2222-2222-222222222222'),
  ('82222222-2222-2222-2222-222222222223', 'Hygiene Kit (Soaps & Paste)', 'hygiene', 'kit', 150, 95, 30, 'Unilever CSR', '2027-04-01', 'c2222222-2222-2222-2222-222222222222'),

  -- Central Warehouse (Camp ID is NULL)
  ('80000000-0000-0000-0000-000000000001', 'Heavy Tarpaulins', 'other', 'piece', 500, 100, 50, 'Tarp India Ltd', NULL, NULL),
  ('80000000-0000-0000-0000-000000000002', 'ORS Packets', 'medicine', 'pack', 2000, 500, 100, 'WHO Supplies', '2027-08-01', NULL);

-- Distributions (Log distribution history)
-- Note: Trigger automatically subtracts stock on insert. Let's make sure the trigger runs or we align the numbers. 
INSERT INTO public.distributions (id, beneficiary_id, camp_id, volunteer_id, notes, created_at) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'Weekly food & blanket ration', now() - interval '2 days'),
  ('d2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222221', 'c2222222-2222-2222-2222-222222222222', 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Medical & hygiene kits issued', now() - interval '1 day');

INSERT INTO public.distribution_items (distribution_id, resource_id, quantity) VALUES
  ('d1111111-1111-1111-1111-111111111111', '81111111-1111-1111-1111-111111111111', 2), -- 2 Rice Bags
  ('d1111111-1111-1111-1111-111111111111', '81111111-1111-1111-1111-111111111114', 1), -- 1 Blanket
  ('d2222222-2222-2222-2222-222222222222', '82222222-2222-2222-2222-222222222222', 2), -- 2 insulin
  ('d2222222-2222-2222-2222-222222222222', '82222222-2222-2222-2222-222222222223', 1); -- 1 hygiene kit

-- Donations
INSERT INTO public.donations (id, donor_name, donor_contact, resource_name, category, quantity, status, approved_by, camp_id, notes, created_at) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'Rotary Club Cochin', '9447788990', 'Blankets', 'blankets', 100, 'approved', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'c1111111-1111-1111-1111-111111111111', 'High quality wool blankets', now() - interval '5 days'),
  ('e2222222-2222-2222-2222-222222222222', 'Federal Bank Staff Union', '0484-2536782', 'Baby Food Formula', 'baby_supplies', 50, 'pending', NULL, 'c1111111-1111-1111-1111-111111111111', 'Aptamil 400g packs', now() - interval '1 day'),
  ('e3333333-3333-3333-3333-333333333333', 'Varghese George', '9847123123', 'Bottled Mineral Water', 'water', 500, 'pending', NULL, 'c2222222-2222-2222-2222-222222222222', '500 cartons of 1L bottles', now()),
  ('e4444444-4444-4444-4444-444444444444', 'Local Traders Assoc', NULL, 'Old Clothes', 'clothes', 200, 'rejected', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', NULL, 'Rejected due to poor quality/hygiene issues', now() - interval '3 days');

-- Resource Requests
INSERT INTO public.resource_requests (id, camp_id, requested_by, category, quantity, priority, status, reason, created_at) VALUES
  ('91111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'water', 1000, 'critical', 'pending', 'Drinking water pipelines broken in Chengannur; urgent supply needed.', now() - interval '4 hours'),
  ('92222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'medicine', 50, 'high', 'approved', 'Dengue cases suspected; paracetamol & test kits required.', now() - interval '1 day'),
  ('93333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', NULL, 'blankets', 200, 'medium', 'fulfilled', 'Chalakudy experiencing drops in temperature during night rains.', now() - interval '3 days'),
  ('94444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', NULL, 'baby_supplies', 30, 'high', 'pending', 'Many infants registered yesterday; baby food & diapers urgent.', now() - interval '2 hours');

-- Support Requests
INSERT INTO public.support_requests (id, beneficiary_id, type, description, status, response, responded_by, created_at) VALUES
  ('51111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'medical', 'Requires insulin dosage refills urgently. Diabetes patient.', 'in_progress', 'Doctor notified. Dispatching meds from sub-center.', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', now() - interval '5 hours'),
  ('52222222-2222-2222-2222-222222222221', 'b2222222-2222-2222-2222-222222222221', 'shelter', 'Rethamma is 72 and needs wheel-chair access path to public bathroom.', 'pending', NULL, NULL, now() - interval '2 hours'),
  ('53333333-3333-3333-3333-333333333333', 'b1111111-1111-1111-1111-111111111114', 'food', 'Needs lactose-free baby food formula.', 'resolved', 'Handed over 2 cans of Similac Lactose-Free.', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', now() - interval '1 day');

-- Notifications
INSERT INTO public.notifications (id, user_id, title, body, kind, read, created_at) VALUES
  ('71111111-1111-1111-1111-111111111111', NULL, 'Critical Water Shortage', 'Chengannur shelter running out of clean drinking water.', 'alert', false, now() - interval '10 mins'),
  ('72222222-2222-2222-2222-222222222222', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Low Stock: Diapers', 'Aluva GHSS has only 5 packs of baby diapers remaining.', 'warning', false, now() - interval '1 hour'),
  ('73333333-3333-3333-3333-333333333333', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'New Donation Alert', 'Federal Bank Staff Union registered a donation of Baby Food.', 'info', true, now() - interval '4 hours'),
  ('74444444-4444-4444-4444-444444444444', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Donation Approved', '100 blankets approved and sent to Aluva GHSS.', 'success', false, now() - interval '12 hours');

-- Audit Logs
INSERT INTO public.audit_logs (user_id, action, entity, entity_id, metadata, created_at) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'login', 'profiles', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '{"ip":"192.168.1.10","user_agent":"Mozilla/5.0"}', now() - interval '2 hours'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'create', 'camps', 'c5555555-5555-5555-5555-555555555555', '{"name":"Adimali Govt School","capacity":150}', now() - interval '1 day'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'update', 'resources', '81111111-1111-1111-1111-111111111112', '{"available_stock":12,"old_stock":192}', now() - interval '4 hours'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'approve', 'donations', 'e1111111-1111-1111-1111-111111111111', '{"donor":"Rotary Club Cochin","item":"Blankets"}', now() - interval '5 days');
