// src/app/(app)/leave/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApplyLeaveForm } from './ApplyLeaveForm';
import { MyLeaveApplications } from './MyLeaveApplications';
import type { LeaveType, LeaveApplication } from './types';

async function getLeavePageData(): Promise<{
  leaveTypes: LeaveType[];
  myApplications: LeaveApplication[];
  userId: string;
}> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // Middleware should ideally handle this, but as a safeguard:
    console.error("User not authenticated in LeavePage:", userError);
    redirect('/login?message=authentication_required');
  }

  // Fetch available leave types
  const { data: leaveTypesData, error: ltError } = await supabase
    .from('leave_types')
    .select('id, name, default_balance') // Ensure all fields needed by LeaveType are selected
    .order('name');

  if (ltError) {
    console.error("Error fetching leave types for LeavePage:", ltError.message);
    // Depending on severity, you might throw error or return empty array
  }

  // Fetch user's leave applications, joining with leave_types to get the name
  const { data: applicationsData, error: appError } = await supabase
    .from('leave_applications')
    .select(`
      id,
      user_id,
      leave_type_id,
      start_date,
      end_date,
      reason,
      status,
      approved_by,
      comments,
      requested_at,
      updated_at,
      leave_types (name)
    `)
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })
    .order('requested_at', { ascending: false }); // Secondary sort by request time

  if (appError) {
    console.error("Error fetching user's leave applications:", appError.message);
  }

  return {
    leaveTypes: (leaveTypesData as LeaveType[]) || [],
    // Ensure the mapping matches the LeaveApplication type, especially the nested leave_types
    myApplications: (applicationsData?.map(app => ({
      ...app,
      leave_types: app.leave_types as { name: string } | undefined // Supabase might return actual object or null
    })) as LeaveApplication[]) || [],
    userId: user.id,
  };
}

export default async function LeavePage() {
  const { leaveTypes, myApplications, userId } = await getLeavePageData();

  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Leave Management</h1>
        <p className="text-sm text-gray-500 mt-1">Apply for leave and view your application history below.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <ApplyLeaveForm leaveTypes={leaveTypes} userId={userId} />
        </div>
        <div className="lg:col-span-2">
          <MyLeaveApplications initialApplications={myApplications} />
        </div>
      </div>
    </div>
  );
}
