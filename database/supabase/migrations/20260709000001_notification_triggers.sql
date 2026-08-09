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
