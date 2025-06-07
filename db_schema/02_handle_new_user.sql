-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  employee_role_id UUID;
BEGIN
  -- Get the UUID of the 'Employee' role
  SELECT id INTO employee_role_id FROM public.roles WHERE name = 'Employee' LIMIT 1;

  -- If 'Employee' role doesn't exist, employee_role_id will be NULL.
  -- The role_id in user_profiles will then be NULL.
  -- This is acceptable as per the table definition (ON DELETE SET NULL for role_id).

  INSERT INTO public.user_profiles (id, full_name, role_id)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', employee_role_id); -- Assign 'Employee' role by default
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
