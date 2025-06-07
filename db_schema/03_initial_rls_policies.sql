-- Enable RLS for tables if not already enabled (this is usually done in Supabase UI, but good to note)
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
-- Add for other tables as needed:
-- ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.leave_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.laborers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.labor_attendance ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.wage_settlements ENABLE ROW LEVEL SECURITY;

-- For user_profiles SELECT
CREATE POLICY "Users can view their own profile"
ON public.user_profiles FOR SELECT
USING (auth.uid() = id);

-- For user_profiles UPDATE
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- For attendance SELECT
CREATE POLICY "Users can view their own attendance"
ON public.attendance FOR SELECT
USING (auth.uid() = user_id);

-- For attendance INSERT
CREATE POLICY "Users can insert their own attendance"
ON public.attendance FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- For attendance UPDATE
CREATE POLICY "Users can update their own attendance"
ON public.attendance FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- For leave_applications SELECT
CREATE POLICY "Users can view their own leave applications"
ON public.leave_applications FOR SELECT
USING (auth.uid() = user_id);

-- For leave_applications INSERT
CREATE POLICY "Users can insert their own leave applications"
ON public.leave_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- For leave_applications UPDATE
CREATE POLICY "Users can update their own leave applications"
ON public.leave_applications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- For leave_applications DELETE
CREATE POLICY "Users can delete their own leave applications"
ON public.leave_applications FOR DELETE
USING (auth.uid() = user_id);


-- For roles and permissions, they might be readable by all authenticated users for now.
-- More restrictive policies will be added later (e.g., only Admin can modify roles/permissions).
CREATE POLICY "Authenticated users can view roles"
ON public.roles FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT
USING (auth.role() = 'authenticated');

-- Example for role_permissions: Authenticated users can view (useful for client-side logic if needed)
CREATE POLICY "Authenticated users can view role_permissions"
ON public.role_permissions FOR SELECT
USING (auth.role() = 'authenticated');

-- Example for leave_types: Authenticated users can view
CREATE POLICY "Authenticated users can view leave_types"
ON public.leave_types FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS for Laborers (example: only created_by or specific roles can manage)
-- For now, allowing authenticated users to view. Insert/Update/Delete will need role-based checks.
CREATE POLICY "Authenticated users can view laborers"
ON public.laborers FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS for Labor Attendance (example: only recorded_by or specific roles)
-- For now, allowing authenticated users to view. Insert/Update/Delete will need role-based checks.
CREATE POLICY "Authenticated users can view labor_attendance"
ON public.labor_attendance FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS for Payment Accounts
CREATE POLICY "Authenticated users can view payment_accounts"
ON public.payment_accounts FOR SELECT
USING (auth.role() = 'authenticated');

-- RLS for Transactions
CREATE POLICY "Users can view transactions related to them or recorded by them"
ON public.transactions FOR SELECT
USING (
  auth.uid() = related_user_id OR
  auth.uid() = recorded_by
  -- Additional conditions for laborers or specific roles might be needed
);

-- RLS for Wage Settlements
CREATE POLICY "Users can view wage settlements related to them or settled by them"
ON public.wage_settlements FOR SELECT
USING (
  auth.uid() = settled_by
  -- Laborers viewing their own settlements would require joining with laborers table
  -- and linking auth.uid() to a user who is also a laborer or a specific RLS function.
  -- For now, keeping it simple.
);

-- Note: These are initial basic policies. More granular and role-based policies
-- will be required as the application features are built out.
-- For example, 'Admin' role bypassing RLS for management purposes,
-- 'Supervisor' role managing their team's attendance, etc.
-- These often involve creating SQL helper functions to check user roles and permissions.
-- The `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` commands are typically run once
-- via the Supabase dashboard or a migration tool. They are included here for completeness
-- but commented out as they only need to be run once. If RLS is not enabled on a table,
-- policies will not apply.
