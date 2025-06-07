-- File: 06_user_profiles_rls.sql
-- This script sets up Row-Level Security for the 'user_profiles' table.
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

-- Enable RLS on user_profiles table if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts if re-applying (optional, be careful)
-- DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
-- DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
-- DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
-- DROP POLICY IF EXISTS "Users can update their own profile data" ON public.user_profiles;
-- DROP POLICY IF EXISTS "Profile creation via trigger" ON public.user_profiles;


-- Policy: Admins can view all user profiles
CREATE POLICY "Admins can view all user profiles"
ON public.user_profiles FOR SELECT
USING (public.get_user_role_name(auth.uid()) = 'Admin');

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Admins can update any user profile (including role_id)
CREATE POLICY "Admins can update user profiles"
ON public.user_profiles FOR UPDATE
USING (public.get_user_role_name(auth.uid()) = 'Admin')
WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin');

-- Policy: Users can update their own profile data (e.g., full_name).
-- IMPORTANT: This policy, as written, DOES NOT prevent a user from updating their own `role_id` via an API call
-- if they craft it. The application UI (non-admin parts) MUST NOT provide a field for users to edit their `role_id`.
-- For true security on `role_id` modification by non-admins, a more advanced RLS (column-specific, if supported),
-- a trigger, or an edge function that only allows specific fields to be updated by non-admins is recommended.
CREATE POLICY "Users can update their own profile data"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);


-- Regarding INSERT policy for user_profiles:
-- Our application uses a trigger `handle_new_user` (from `02_handle_new_user.sql`)
-- which runs `SECURITY DEFINER`. This means the trigger bypasses RLS for its specific INSERT operation
-- into `user_profiles` when a new user signs up in `auth.users`.
-- Therefore, an explicit INSERT policy for general users on `user_profiles` is likely not needed
-- and could be omitted to prevent direct inserts if the trigger is the sole intended mechanism for profile creation.
-- If direct inserts were ever allowed or needed for some other reason, a policy like:
-- CREATE POLICY "Allow profile insert if user matches"
-- ON public.user_profiles FOR INSERT
-- WITH CHECK (auth.uid() = id);
-- could be added. For now, we rely on the trigger.

SELECT 'RLS policies for user_profiles table created/updated. Ensure get_user_role_name() function exists and review user update policy notes.';
