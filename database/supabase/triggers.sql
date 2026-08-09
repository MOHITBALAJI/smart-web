-- ============================================================
-- Smart Flood Emergency Response and Relief Management System
-- Database Triggers and Functions
-- File: triggers.sql
-- ============================================================
-- Run this AFTER schema.sql and policies.sql

-- ============================================================
-- TRIGGER 1: updated_at auto-update
-- Applies to: users, sos_requests, inventory, relief_camps
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to users
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_set_updated_at();

-- Apply updated_at trigger to sos_requests
DROP TRIGGER IF EXISTS trg_sos_requests_updated_at ON public.sos_requests;
CREATE TRIGGER trg_sos_requests_updated_at
    BEFORE UPDATE ON public.sos_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_set_updated_at();

-- Apply updated_at trigger to inventory
DROP TRIGGER IF EXISTS trg_inventory_updated_at ON public.inventory;
CREATE TRIGGER trg_inventory_updated_at
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_set_updated_at();

-- Apply updated_at trigger to relief_camps
DROP TRIGGER IF EXISTS trg_relief_camps_updated_at ON public.relief_camps;
CREATE TRIGGER trg_relief_camps_updated_at
    BEFORE UPDATE ON public.relief_camps
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- TRIGGER 2: resource_distribution → decrease inventory stock
-- After INSERT on resource_distribution, decrease current_stock
-- in inventory for each item in the JSONB items array
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_deduct_inventory_on_distribution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_item          JSONB;
    v_quantity      INTEGER;
    v_item_name     TEXT;
    v_inventory_id  UUID;
    v_current_stock INTEGER;
BEGIN
    -- Iterate over each item in the JSONB array
    FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
        v_item_name := v_item->>'item_name';
        v_quantity  := (v_item->>'quantity')::INTEGER;

        IF v_quantity IS NULL OR v_quantity <= 0 THEN
            CONTINUE;
        END IF;

        -- Lock the inventory row for this camp + item
        SELECT id, current_stock
        INTO v_inventory_id, v_current_stock
        FROM public.inventory
        WHERE camp_id  = NEW.camp_id
          AND item_name = v_item_name
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE WARNING 'Inventory item "%" not found in camp %. Skipping deduction.', v_item_name, NEW.camp_id;
            CONTINUE;
        END IF;

        IF v_current_stock < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for item "%" in camp %. Available: %, Requested: %',
                v_item_name, NEW.camp_id, v_current_stock, v_quantity;
        END IF;

        -- Deduct from current_stock and increment total_distributed
        UPDATE public.inventory
        SET
            current_stock     = current_stock - v_quantity,
            total_distributed = total_distributed + v_quantity,
            updated_at        = NOW()
        WHERE id = v_inventory_id;

    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resource_distribution_deduct_inventory ON public.resource_distribution;
CREATE TRIGGER trg_resource_distribution_deduct_inventory
    AFTER INSERT ON public.resource_distribution
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_deduct_inventory_on_distribution();

-- ============================================================
-- TRIGGER 3: sos_requests INSERT → notify district_admins & super_admins
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_notify_on_sos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin         RECORD;
    v_title         TEXT;
    v_message       TEXT;
    v_data          JSONB;
    v_reporter_name TEXT;
BEGIN
    v_reporter_name := COALESCE(NEW.reporter_name, 'Anonymous');
    v_title   := 'New SOS Alert — Level ' || NEW.emergency_level || ' Emergency';
    v_message := 'An emergency SOS has been reported by ' || v_reporter_name ||
                 '. Type: ' || NEW.emergency_type ||
                 '. Lat: ' || NEW.latitude || ', Lng: ' || NEW.longitude ||
                 '. Status: ' || NEW.status || '.';
    v_data := jsonb_build_object(
        'sos_request_id',  NEW.id,
        'emergency_type',  NEW.emergency_type,
        'emergency_level', NEW.emergency_level,
        'latitude',        NEW.latitude,
        'longitude',       NEW.longitude,
        'status',          NEW.status
    );

    -- Notify all super_admin users
    FOR v_admin IN
        SELECT id FROM public.users
        WHERE role = 'super_admin' AND is_active = TRUE
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (v_admin.id, 'sos_alert', v_title, v_message, v_data);
    END LOOP;

    -- Notify district_admin users
    -- (district inferred from nearest camp or broadcast to all district admins)
    FOR v_admin IN
        SELECT id FROM public.users
        WHERE role = 'district_admin' AND is_active = TRUE
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (v_admin.id, 'sos_alert', v_title, v_message, v_data);
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sos_requests_notify ON public.sos_requests;
CREATE TRIGGER trg_sos_requests_notify
    AFTER INSERT ON public.sos_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_notify_on_sos();

-- ============================================================
-- TRIGGER 4: beneficiaries INSERT → generate unique QR code data
-- Format: FLOOD-{id}-{camp_id}-{family_head_id}
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_generate_qr_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_camp_part   TEXT;
    v_family_part TEXT;
BEGIN
    -- Use 'NOCAMP' if no camp assigned yet
    v_camp_part := COALESCE(NEW.current_camp_id::TEXT, 'NOCAMP');

    -- The family_head_id is the beneficiary's own id (they are the head)
    -- unless linked later; for now use the beneficiary's own new id
    v_family_part := NEW.id::TEXT;

    NEW.qr_code_data := 'FLOOD-' || NEW.id::TEXT || '-' || v_camp_part || '-' || v_family_part;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beneficiaries_qr_code ON public.beneficiaries;
CREATE TRIGGER trg_beneficiaries_qr_code
    BEFORE INSERT ON public.beneficiaries
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_generate_qr_code();

-- ============================================================
-- TRIGGER 5: relief_camps UPDATE → notify 'Camp Full'
-- Fires when current_occupancy >= max_capacity
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_notify_camp_full()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin  RECORD;
    v_title  TEXT;
    v_msg    TEXT;
    v_data   JSONB;
BEGIN
    -- Only act if just became full (wasn't full before, now is)
    IF OLD.current_occupancy < OLD.max_capacity
       AND NEW.current_occupancy >= NEW.max_capacity
    THEN
        -- Update status to 'full'
        NEW.status := 'full';

        v_title := 'Camp Full: ' || NEW.name;
        v_msg   := 'Relief camp "' || NEW.name || '" has reached maximum capacity (' ||
                   NEW.max_capacity || ' occupants). No more admissions possible.';
        v_data  := jsonb_build_object(
            'camp_id',           NEW.id,
            'camp_name',         NEW.name,
            'current_occupancy', NEW.current_occupancy,
            'max_capacity',      NEW.max_capacity,
            'district_id',       NEW.district_id
        );

        -- Notify super_admins
        FOR v_admin IN
            SELECT id FROM public.users
            WHERE role = 'super_admin' AND is_active = TRUE
        LOOP
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (v_admin.id, 'camp_full', v_title, v_msg, v_data);
        END LOOP;

        -- Notify district_admins in the same district
        FOR v_admin IN
            SELECT id FROM public.users
            WHERE role = 'district_admin'
              AND district_id = NEW.district_id
              AND is_active = TRUE
        LOOP
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (v_admin.id, 'camp_full', v_title, v_msg, v_data);
        END LOOP;

        -- Notify the camp officer
        IF NEW.officer_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (NEW.officer_id, 'camp_full', v_title, v_msg, v_data);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_relief_camps_notify_full ON public.relief_camps;
CREATE TRIGGER trg_relief_camps_notify_full
    BEFORE UPDATE ON public.relief_camps
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_notify_camp_full();

-- ============================================================
-- TRIGGER 6: inventory UPDATE → notify 'Low Stock'
-- Fires when current_stock falls at or below min_threshold
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_notify_low_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_camp   RECORD;
    v_admin  RECORD;
    v_title  TEXT;
    v_msg    TEXT;
    v_data   JSONB;
BEGIN
    -- Only act when stock just crossed the threshold (from above to at/below)
    IF OLD.current_stock > OLD.min_threshold
       AND NEW.current_stock <= NEW.min_threshold
    THEN
        -- Fetch camp and district info
        SELECT rc.name AS camp_name, rc.district_id, rc.officer_id
        INTO v_camp
        FROM public.relief_camps rc
        WHERE rc.id = NEW.camp_id;

        v_title := 'Low Stock Alert: ' || NEW.item_name;
        v_msg   := 'Item "' || NEW.item_name || '" at camp "' || v_camp.camp_name ||
                   '" has reached low stock. Current stock: ' || NEW.current_stock ||
                   ' ' || NEW.unit || ' (Threshold: ' || NEW.min_threshold || ').';
        v_data  := jsonb_build_object(
            'inventory_id',  NEW.id,
            'camp_id',       NEW.camp_id,
            'camp_name',     v_camp.camp_name,
            'item_name',     NEW.item_name,
            'category',      NEW.category,
            'current_stock', NEW.current_stock,
            'min_threshold', NEW.min_threshold,
            'unit',          NEW.unit,
            'district_id',   v_camp.district_id
        );

        -- Notify super_admins
        FOR v_admin IN
            SELECT id FROM public.users
            WHERE role = 'super_admin' AND is_active = TRUE
        LOOP
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (v_admin.id, 'low_stock', v_title, v_msg, v_data);
        END LOOP;

        -- Notify district_admins in the same district
        FOR v_admin IN
            SELECT id FROM public.users
            WHERE role = 'district_admin'
              AND district_id = v_camp.district_id
              AND is_active = TRUE
        LOOP
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (v_admin.id, 'low_stock', v_title, v_msg, v_data);
        END LOOP;

        -- Notify the camp officer
        IF v_camp.officer_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (v_camp.officer_id, 'low_stock', v_title, v_msg, v_data);
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_notify_low_stock ON public.inventory;
CREATE TRIGGER trg_inventory_notify_low_stock
    AFTER UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_notify_low_stock();

-- ============================================================
-- TRIGGER 7: Handle new auth.users → auto-create public.users row
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, full_name, phone, role, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.raw_user_meta_data->>'role', 'beneficiary'),
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_user_created ON auth.users;
CREATE TRIGGER trg_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_handle_new_auth_user();

-- ============================================================
-- TRIGGER 8: beneficiaries UPDATE — sync camp occupancy
-- When a beneficiary's current_camp_id changes, update occupancy
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_sync_camp_occupancy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Decrement old camp occupancy
    IF OLD.current_camp_id IS NOT NULL AND OLD.current_camp_id IS DISTINCT FROM NEW.current_camp_id THEN
        UPDATE public.relief_camps
        SET current_occupancy = GREATEST(0, current_occupancy - 1),
            beds_available    = LEAST(beds_total, beds_available + 1),
            updated_at        = NOW()
        WHERE id = OLD.current_camp_id;
    END IF;

    -- Increment new camp occupancy
    IF NEW.current_camp_id IS NOT NULL AND NEW.current_camp_id IS DISTINCT FROM OLD.current_camp_id THEN
        UPDATE public.relief_camps
        SET current_occupancy = current_occupancy + 1,
            beds_available    = GREATEST(0, beds_available - 1),
            updated_at        = NOW()
        WHERE id = NEW.current_camp_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beneficiaries_sync_occupancy ON public.beneficiaries;
CREATE TRIGGER trg_beneficiaries_sync_occupancy
    AFTER UPDATE OF current_camp_id ON public.beneficiaries
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_camp_occupancy();

-- Also trigger on INSERT to increment count when beneficiary is first placed in a camp
CREATE OR REPLACE FUNCTION public.fn_sync_camp_occupancy_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.current_camp_id IS NOT NULL THEN
        UPDATE public.relief_camps
        SET current_occupancy = current_occupancy + 1,
            beds_available    = GREATEST(0, beds_available - 1),
            updated_at        = NOW()
        WHERE id = NEW.current_camp_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beneficiaries_occupancy_insert ON public.beneficiaries;
CREATE TRIGGER trg_beneficiaries_occupancy_insert
    AFTER INSERT ON public.beneficiaries
    FOR EACH ROW
    WHEN (NEW.current_camp_id IS NOT NULL)
    EXECUTE FUNCTION public.fn_sync_camp_occupancy_on_insert();

-- ============================================================
-- TRIGGER 9: SOS status update → update volunteer availability
-- When SOS status changes to 'rescued', free the volunteer
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_update_volunteer_on_rescue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'rescued' AND OLD.status != 'rescued' THEN
        -- Increment total_missions and free the volunteer
        IF NEW.assigned_volunteer_id IS NOT NULL THEN
            UPDATE public.volunteers
            SET is_available  = TRUE,
                total_missions = total_missions + 1
            WHERE id = NEW.assigned_volunteer_id;
        END IF;
    END IF;

    -- When SOS is assigned, mark volunteer as unavailable
    IF NEW.status = 'assigned' AND OLD.status = 'pending'
       AND NEW.assigned_volunteer_id IS NOT NULL
    THEN
        UPDATE public.volunteers
        SET is_available = FALSE
        WHERE id = NEW.assigned_volunteer_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sos_update_volunteer ON public.sos_requests;
CREATE TRIGGER trg_sos_update_volunteer
    AFTER UPDATE OF status ON public.sos_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_update_volunteer_on_rescue();

-- ============================================================
-- TRIGGER 10: inventory INSERT → check stock consistency
-- Ensure current_stock = total_received - total_distributed on insert
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_set_inventory_stock_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Auto-compute current_stock if not explicitly provided
    IF NEW.current_stock = 0 AND NEW.total_received > 0 THEN
        NEW.current_stock := NEW.total_received - NEW.total_distributed;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_stock_insert ON public.inventory;
CREATE TRIGGER trg_inventory_stock_insert
    BEFORE INSERT ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_set_inventory_stock_on_insert();
