-- File: 08_leave_management_rls.sql
-- This script sets up Row-Level Security for 'leave_types' and 'leave_applications' tables.
--
-- IMPORTANT:
-- These policies rely on the SQL helper function `get_user_role_name(user_id UUID)`
-- (e.g., from `04_roles_rls.sql`). Ensure this function exists and is correctly defined.
--
-- Example `get_user_role_name` function:
/*
CREATE OR REPLACE FUNCTION get_user_role_name(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM public.user_profiles up
  JOIN public.roles r ON up.role_id = r.id
  WHERE up.id = p_user_id;

  RETURN role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- RLS for leave_types table
ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts if re-applying (optional)
-- DROP POLICY IF EXISTS "Admins can manage leave types" ON public.leave_types;
-- DROP POLICY IF EXISTS "Authenticated users can view leave types" ON public.leave_types;

-- Admins can manage all leave types.
CREATE POLICY "Admins can manage leave types"
ON public.leave_types FOR ALL
USING (public.get_user_role_name(auth.uid()) = 'Admin')
WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin');

-- Authenticated users can view leave types (e.g., to select from a dropdown when applying for leave).
CREATE POLICY "Authenticated users can view leave types"
ON public.leave_types FOR SELECT
USING (auth.role() = 'authenticated');


-- RLS for leave_applications table
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts if re-applying (optional)
-- DROP POLICY IF EXISTS "Users can create their own leave applications" ON public.leave_applications;
-- DROP POLICY IF EXISTS "Users can view their own leave applications" ON public.leave_applications;
-- DROP POLICY IF EXISTS "Users can update their own pending leave applications" ON public.leave_applications;
-- DROP POLICY IF EXISTS "Admins and Supervisors can view all leave applications" ON public.leave_applications;
-- DROP POLICY IF EXISTS "Admins and Supervisors can approve/reject leave applications" ON public.leave_applications;
-- DROP POLICY IF EXISTS "Admins can delete leave applications" ON public.leave_applications;

-- Users can create their own leave applications.
CREATE POLICY "Users can create their own leave applications"
ON public.leave_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own leave applications.
CREATE POLICY "Users can view their own leave applications"
ON public.leave_applications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own PENDING leave applications (e.g., to cancel/withdraw by setting status to 'cancelled').
-- They should not modify already approved/rejected ones, or other fields once submitted without specific logic.
CREATE POLICY "Users can update their own pending leave applications"
ON public.leave_applications FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (
    auth.uid() = user_id AND
    ( OLD.status = 'pending' AND ( NEW.status = 'cancelled' OR NEW.status = 'pending' ) ) AND -- Can only change to 'cancelled' or keep 'pending'
    -- For other fields, ensure they are not changed by the user during this update:
    NEW.leave_type_id = OLD.leave_type_id AND
    NEW.start_date = OLD.start_date AND
    NEW.end_date = OLD.end_date AND
    NEW.reason = OLD.reason AND
    NEW.approved_by = OLD.approved_by AND -- User cannot approve their own request
    NEW.comments = OLD.comments -- User cannot add approval comments
    -- `requested_at` should not change. `updated_at` will be handled by trigger.
);

-- Admins and Supervisors can view all leave applications.
-- (Supervisors might be restricted to their team's applications in a more complex setup).
CREATE POLICY "Admins and Supervisors can view all leave applications"
ON public.leave_applications FOR SELECT
USING (
  public.get_user_role_name(auth.uid()) = 'Admin' OR
  public.get_user_role_name(auth.uid()) = 'Supervisor'
);

-- Admins and Supervisors can update leave applications (e.g., to approve/reject).
-- They should primarily be changing status, approved_by, and comments.
CREATE POLICY "Admins and Supervisors can approve/reject leave applications"
ON public.leave_applications FOR UPDATE
USING (
  public.get_user_role_name(auth.uid()) = 'Admin' OR
  public.get_user_role_name(auth.uid()) = 'Supervisor'
)
WITH CHECK (
  (public.get_user_role_name(auth.uid()) = 'Admin' OR public.get_user_role_name(auth.uid()) = 'Supervisor') AND
  NEW.user_id = OLD.user_id AND -- Cannot change who the application is for
  NEW.leave_type_id = OLD.leave_type_id AND -- Generally, approver shouldn't change these core details
  NEW.start_date = OLD.start_date AND
  NEW.end_date = OLD.end_date AND
  NEW.reason = OLD.reason
  -- Allow changes to: status, approved_by, comments
);

-- Optional: Admins can delete leave applications (use with caution, as it might be better to mark as 'void' or 'archived').
CREATE POLICY "Admins can delete leave applications"
ON public.leave_applications FOR DELETE
USING (public.get_user_role_name(auth.uid()) = 'Admin');

SELECT 'RLS policies for leave_types and leave_applications tables created/updated. Ensure get_user_role_name() function exists.';
