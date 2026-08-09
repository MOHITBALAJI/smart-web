-- Volunteer camp assignments
CREATE TABLE public.volunteer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camp_id UUID NOT NULL REFERENCES public.camps(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(volunteer_id, camp_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.volunteer_assignments TO authenticated;
GRANT ALL ON public.volunteer_assignments TO service_role;
ALTER TABLE public.volunteer_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "va_staff_read" ON public.volunteer_assignments FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR volunteer_id = auth.uid());
CREATE POLICY "va_admin_write" ON public.volunteer_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'camp_officer')) WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'camp_officer'));

-- Volunteer shifts
CREATE TABLE public.volunteer_shifts (
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
CREATE POLICY "vs_staff_read" ON public.volunteer_shifts FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR volunteer_id = auth.uid());
CREATE POLICY "vs_admin_write" ON public.volunteer_shifts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'camp_officer')) WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'camp_officer'));

-- Also fix distribution_items read policy so beneficiary portal can see their items
CREATE POLICY "dist_items_beneficiary_read" ON public.distribution_items FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.distributions d
      JOIN public.beneficiaries b ON b.id = d.beneficiary_id
      WHERE d.id = distribution_id AND b.user_id = auth.uid()
    )
  );
