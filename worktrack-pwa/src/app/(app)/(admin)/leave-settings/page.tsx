// src/app/(app)/(admin)/leave-settings/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ManageLeaveTypes } from './ManageLeaveTypes'; // Client component
import type { LeaveType } from './types';

async function getLeaveTypes(): Promise<LeaveType[]> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data, error } = await supabase
    .from('leave_types')
    .select('*')
    .order('name', { ascending: true }); // Order alphabetically by name

  if (error) {
    console.error('Error fetching leave types in AdminLeaveSettingsPage:', error.message);
    // In a real app, you might want to throw an error or return an object indicating failure
    // to be handled by an error boundary or the component itself.
    return []; // Return empty array on error for now
  }
  return data as LeaveType[];
}

export default async function AdminLeaveSettingsPage() {
  const leaveTypes = await getLeaveTypes();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-2">
        <h2 className="text-xl font-semibold text-gray-800">Manage Leave Types</h2>
        <Link href="/(app)/(admin)/dashboard" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </Link>
      </div>
      <ManageLeaveTypes initialLeaveTypes={leaveTypes} />
    </div>
  );
}
