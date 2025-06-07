-- File: 04_roles_rls.sql
-- This script sets up Row-Level Security for the 'roles' table.
--
-- IMPORTANT:
-- The policy "Admins can manage roles" relies on a SQL helper function
-- `get_user_role_name(user_id UUID)` which should return the name of the role
-- for the given user_id (e.g., 'Admin', 'Employee').
--
-- You must create this function in your Supabase SQL editor before these RLS policies
-- will work correctly. Example function (you might need to adjust based on your schema):
/*
CREATE OR REPLACE FUNCTION get_user_role_name(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  role_name TEXT;
BEGIN
  SELECT r.name INTO role_name
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = p_user_id;

  RETURN role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
-- Make sure this function is callable by `auth.uid()` in RLS policies.
-- Consider setting appropriate search_path for the function if schemas are involved.

-- First, ensure RLS is enabled on the roles table.
-- You can run this once. If it's already enabled, it will give a notice.
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts if re-applying (optional, be careful)
-- DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
-- DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;

-- Policy: Admins can perform all operations on the roles table.
CREATE POLICY "Admins can manage roles"
ON public.roles FOR ALL
USING (public.get_user_role_name(auth.uid()) = 'Admin')
WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin');

-- Policy: Authenticated users can view roles.
-- This allows non-admin users to see role names (e.g., in their profile or user lists).
-- Adjust as necessary for your application's security requirements.
CREATE POLICY "Authenticated users can view roles"
ON public.roles FOR SELECT
USING (auth.role() = 'authenticated');

-- Grant usage on the public schema if your function is there and not accessible
-- GRANT USAGE ON SCHEMA public TO supabase_auth_admin; -- Or the relevant role for RLS execution
-- GRANT EXECUTE ON FUNCTION public.get_user_role_name(UUID) TO supabase_auth_admin; -- Or the relevant role

-- Note: If your `user_profiles` table or `roles` table are in a different schema
-- than `public`, ensure the `get_user_role_name` function and RLS policies
-- correctly reference them (e.g. `SELECT r.name FROM private.user_profiles ...`).
-- The example function assumes `user_profiles` and `roles` are in the same schema
-- as the function or accessible via search_path.
-- The `public.` prefix is added to policies for clarity if tables are in public schema.

-- Reminder: The `user_profiles` table should also have appropriate RLS policies,
-- especially to protect the `role_id` field from unauthorized modification.
-- Example (conceptual, adapt to your needs):
/*
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile (excluding role_id)"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND (SELECT get_user_role_name(auth.uid())) <> 'Admin'); -- Prevent self-update of role by non-admins

CREATE POLICY "Admins can manage all user profiles"
ON public.user_profiles FOR ALL
USING (get_user_role_name(auth.uid()) = 'Admin')
WITH CHECK (get_user_role_name(auth.uid()) = 'Admin');
*/

SELECT 'RLS policies for roles table created. Ensure get_user_role_name() function exists.';
