-- File: 05_permissions_rls.sql
-- This script sets up Row-Level Security for the 'permissions' and 'role_permissions' tables.
--
-- IMPORTANT:
-- These policies rely on the same SQL helper function `get_user_role_name(user_id UUID)`
-- mentioned in `04_roles_rls.sql`. Ensure this function exists and is correctly defined
-- in your Supabase SQL editor.
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

-- RLS for permissions table
-- Enable RLS if not already enabled
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts if re-applying (optional)
-- DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
-- DROP POLICY IF EXISTS "Authenticated users can view permissions" ON public.permissions;

CREATE POLICY "Admins can manage permissions"
ON public.permissions FOR ALL
USING (public.get_user_role_name(auth.uid()) = 'Admin')
WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin');

CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT
USING (auth.role() = 'authenticated');


-- RLS for role_permissions table
-- Enable RLS if not already enabled
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts if re-applying (optional)
-- DROP POLICY IF EXISTS "Admins can manage role-permission assignments" ON public.role_permissions;
-- DROP POLICY IF EXISTS "Authenticated users can view their own role-permission assignments" ON public.role_permissions;


CREATE POLICY "Admins can manage role-permission assignments"
ON public.role_permissions FOR ALL
USING (public.get_user_role_name(auth.uid()) = 'Admin')
WITH CHECK (public.get_user_role_name(auth.uid()) = 'Admin');

-- Policy for authenticated users to view their own effective permissions (indirectly).
-- This allows a user to know what permissions are associated with their own role.
-- This is useful for client-side checks or displaying user-specific UI elements.
-- Note: This assumes `user_profiles` table has a `role_id` that links to `roles` table.
CREATE POLICY "Authenticated users can view their own role-permission assignments"
ON public.role_permissions FOR SELECT
USING (EXISTS (
  SELECT 1
  FROM public.user_profiles up
  WHERE up.id = auth.uid() AND up.role_id = public.role_permissions.role_id
));

SELECT 'RLS policies for permissions and role_permissions tables created. Ensure get_user_role_name() function exists.';
