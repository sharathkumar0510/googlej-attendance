// src/app/(app)/(admin)/roles/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { RoleManagementActions } from './RoleManagementActions'; // Client Component for actions

export type Role = {
  id: string; // Changed from UUID to string for simplicity, Supabase client handles it.
  name: string;
  description: string | null;
  created_at: string;
};

async function getRoles(): Promise<Role[]> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data, error } = await supabase.from('roles').select('*').order('name');

  if (error) {
    console.error('Error fetching roles:', error);
    // Optionally, throw the error to be caught by Next.js error boundary
    // throw new Error(`Failed to fetch roles: ${error.message}`);
    return []; // Return empty array on error to prevent build failure if page is static
  }
  return data as Role[]; // Type assertion, ensure 'roles' table matches this
}

export default async function ManageRolesPage() {
  const roles = await getRoles();

  return (
    <div className="p-4"> {/* Reduced padding from p-6 to p-4 for consistency */}
      <div className="flex justify-between items-center mb-6"> {/* Increased mb from 4 to 6 */}
        <h2 className="text-xl font-semibold">Manage Roles</h2>
      </div>

      <RoleManagementActions initialRoles={roles} />

      <div className="mt-8"> {/* Increased mt from 6 to 8 */}
        <Link href="/(app)/(admin)/dashboard" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
