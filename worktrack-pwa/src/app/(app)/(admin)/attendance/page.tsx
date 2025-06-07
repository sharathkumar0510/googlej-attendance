// src/app/(app)/(admin)/attendance/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { AllAttendanceView } from './AllAttendanceView'; // Client component for display and filtering
// Common type from employee section can be used if identical for base fields
// import type { AttendanceRecord } from '@/app/(app)/attendance/types';
import type { UserProfileBasic } from './types'; // Admin-specific types

// Function to fetch initial data (all users for filter)
async function getFilterData() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);

  // Fetch all user profiles (id, full_name) for the filter dropdown
  const { data: usersData, error: usersError } = await supabase
    .from('user_profiles')
    .select('id, full_name')
    .order('full_name', { nullsFirst: false }); // Ensure consistent ordering

  if (usersError) {
    console.error('Error fetching users for filter:', usersError.message);
    // Return empty array or throw error, depending on how you want to handle this
  }
  const allUsersForFilter: UserProfileBasic[] = usersData?.map(u => ({
    id: u.id,
    full_name: u.full_name || `User (${u.id.substring(0,6)}...)` // Fallback name
  })) || [];

  return {
    allUsersForFilter,
  };
}


export default async function AdminManageAttendancePage() {
  // searchParams are available if needed for server-side pre-filtering, but client component handles it now
  // { searchParams }: { searchParams: { [key: string]: string | string[] | undefined }; }

  const { allUsersForFilter } = await getFilterData();

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-2">
        <h2 className="text-xl font-semibold text-gray-800">View All Attendance Records</h2>
        <Link href="/(app)/(admin)/dashboard" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Admin Dashboard
        </Link>
      </div>

      <AllAttendanceView
        usersForFilter={allUsersForFilter}
      />

    </div>
  );
}
