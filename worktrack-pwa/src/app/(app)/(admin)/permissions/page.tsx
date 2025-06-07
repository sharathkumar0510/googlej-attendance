// src/app/(app)/(admin)/permissions/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { PermissionAssignment } from './PermissionAssignment'; // Client component

export type Permission = {
  id: string;
  name: string;
  description: string | null;
  created_at: string; // Assuming this field exists from earlier schema
};

export type RoleWithPermissions = {
  id: string;
  name: string;
  permissions: { id: string; name: string }[]; // Array of permission objects
};

async function getData(): Promise<{ roles: RoleWithPermissions[]; allPermissions: Permission[] }> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  // Fetch roles and their assigned permissions
  const { data: rolesData, error: rolesError } = await supabase
    .from('roles')
    .select(`
      id,
      name,
      role_permissions (
        permission_id,
        permissions (id, name)
      )
    `)
    .order('name', { ascending: true });

  if (rolesError) {
    console.error('Error fetching roles with permissions:', rolesError.message);
    // Depending on how critical this is, you might throw an error
    // or return empty arrays and let the UI handle it.
  }

  // Fetch all available permissions
  const { data: permissionsData, error: permissionsError } = await supabase
    .from('permissions')
    .select('id, name, description, created_at')
    .order('name', { ascending: true });

  if (permissionsError) {
    console.error('Error fetching all permissions:', permissionsError.message);
  }

  // Transform rolesData to the desired RoleWithPermissions structure
  const roles: RoleWithPermissions[] = rolesData?.map(role => ({
    id: role.id,
    name: role.name,
    // Ensure that role_permissions and permissions within it are not null
    permissions: role.role_permissions
      // Filter out any entries where the permission itself might be null (e.g., due to a broken FK or RLS on permissions table for the admin)
      .map((rp: any) => rp.permissions)
      .filter((permission: any) => permission !== null)
      // Map to the desired { id; name } structure
      .map((permission: any) => ({ id: permission.id, name: permission.name }))
  })) || [];

  return {
    roles: roles,
    allPermissions: (permissionsData as Permission[]) || [],
  };
}

export default async function ManagePermissionsPage() {
  const { roles, allPermissions } = await getData();

  if (rolesError && permissionsError) { // A simple check if both failed, getData() logs errors
     // The AdminLayout should already prevent non-admins from reaching here.
     // This message is more for if data fetching fails for an Admin.
    return (
        <div className="p-6 text-center">
            <p className="text-red-600 font-semibold">Error Loading Data</p>
            <p className="text-gray-700">Could not load roles or permissions. Please check the server logs or try again later.</p>
            <p className="text-xs text-gray-500 mt-2">Ensure you are an Admin and RLS policies are correctly set, and the database is reachable.</p>
        </div>
    );
  }

  return (
    <div className="p-4"> {/* Consistent padding */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Permissions & Role Assignments</h2>
      </div>

      <PermissionAssignment
        initialRoles={roles}
        allPermissions={allPermissions}
      />

      <div className="mt-8">
        <Link href="/(app)/(admin)/dashboard" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}

// Helper to check for errors to display a message, declared outside component
// This is a simplified check. In getData, errors are logged.
// If getData throws, Next.js error.tsx would catch it. If it returns empty, UI handles it.
const rolesError = false; // Placeholder, real error handling would be more robust
const permissionsError = false; // Placeholder
