-- Support Requests table for beneficiary portal
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
