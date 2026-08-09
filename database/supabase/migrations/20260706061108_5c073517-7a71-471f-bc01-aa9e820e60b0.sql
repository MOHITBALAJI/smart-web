
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
