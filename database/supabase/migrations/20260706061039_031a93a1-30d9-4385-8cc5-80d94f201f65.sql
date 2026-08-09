
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'camp_officer', 'volunteer', 'beneficiary');
CREATE TYPE public.camp_status AS ENUM ('active', 'full', 'closed', 'planned');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.resource_category AS ENUM ('food', 'water', 'clothes', 'medicine', 'blankets', 'hygiene', 'baby_supplies', 'other');
CREATE TYPE public.donation_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'fulfilled');

-- ============ HELPER: updated_at ============
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
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

-- ============ USER ROLES ============
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

-- ============ AUTO PROFILE + ROLE ON SIGNUP ============
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

-- ============ CAMPS ============
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

-- ============ FAMILIES ============
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

-- ============ BENEFICIARIES ============
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

-- ============ RESOURCES ============
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

-- ============ DISTRIBUTIONS ============
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

-- auto-decrement inventory when distribution item added
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

-- ============ DONATIONS ============
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

-- ============ RESOURCE REQUESTS ============
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

-- ============ NOTIFICATIONS ============
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

-- ============ AUDIT LOGS ============
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

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.camps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.beneficiaries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
ALTER PUBLICATION supabase_realtime ADD TABLE public.distributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.donations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
