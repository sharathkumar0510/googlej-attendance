-- File: 07_attendance_rls.sql
-- This script sets up Row-Level Security for the 'attendance' table.
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

-- Enable RLS on attendance table if not already enabled
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts if re-applying (optional, be careful)
-- DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;
-- DROP POLICY IF EXISTS "Users can view their own attendance" ON public.attendance;
-- DROP POLICY IF EXISTS "Users can clock_out of their current attendance" ON public.attendance;
-- DROP POLICY IF EXISTS "Admins and Supervisors can view all attendance" ON public.attendance;
-- DROP POLICY IF EXISTS "Admins can manage all attendance records" ON public.attendance;


-- Policy: Users can insert their own attendance records.
-- Assumes user_id in the attendance record is being set to auth.uid().
CREATE POLICY "Users can insert their own attendance"
ON public.attendance FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own attendance records.
CREATE POLICY "Users can view their own attendance"
ON public.attendance FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can update their own 'open' (not yet clocked_out) attendance record to clock_out.
-- They should not be able to modify old records or clock_in_time once set.
-- This policy allows updating clock_out_time, clock_out_latitude, clock_out_longitude, and notes.
CREATE POLICY "Users can clock_out of their current attendance"
ON public.attendance FOR UPDATE
USING (
    auth.uid() = user_id AND
    clock_out_time IS NULL -- Can only update if not already clocked out
)
WITH CHECK (
    auth.uid() = user_id AND
    clock_out_time IS NOT NULL AND -- On update, clock_out_time must be set (i.e., this is a clock-out operation)
    -- Fields that should NOT change during a clock-out operation:
    clock_in_time = OLD.clock_in_time,
    date = OLD.date,
    user_id = OLD.user_id,
    clock_in_latitude = OLD.clock_in_latitude, -- Assuming these are fixed once clocked in
    clock_in_longitude = OLD.clock_in_longitude
    -- notes can be updated, clock_out_latitude, clock_out_longitude can be updated.
);

-- Policy: Admins and Supervisors can view all attendance records.
-- For Supervisors, this might be further restricted to "their team" in a more complex setup
-- using additional tables or logic within the get_user_role_name or a new function.
CREATE POLICY "Admins and Supervisors can view all attendance"
ON public.attendance FOR SELECT
USING (
  public.get_user_role_name(auth.uid()) = 'Admin' OR
  public.get_user_role_name(auth.uid()) = 'Supervisor'
);

-- Policy: Admins can manage (update/delete) all attendance records.
-- Supervisors are explicitly excluded from this level of modification here,
-- but could be granted more limited update capabilities if needed (e.g., correcting records).
CREATE POLICY "Admins can manage all attendance records"
ON public.attendance FOR ALL -- Includes DELETE and more UPDATE capabilities than user's own clock-out.
USING (public.get_user_role_name(auth.uid()) = 'Admin')
WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin');


SELECT 'RLS policies for attendance table created/updated. Ensure get_user_role_name() function exists.';
