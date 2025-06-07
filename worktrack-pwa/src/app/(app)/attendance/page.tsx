// src/app/(app)/attendance/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
    import { ClockInOut } from './ClockInOut';
    import { AttendanceHistory } from './AttendanceHistory'; // Import the new component
import { redirect } from 'next/navigation'; // Corrected import
import type { AttendanceRecord } from './types';
import Link from 'next/link'; // For navigation if needed

async function getTodaysAttendance(): Promise<AttendanceRecord | null> {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // This should ideally be caught by middleware protecting the (app) group
    console.error('User not authenticated in AttendancePage:', userError);
        redirect('/login?message=auth_required');
  }

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .order('clock_in_time', { ascending: false }) // Get the latest one for today
    .limit(1)
    .maybeSingle(); // Returns null if no record found, instead of an empty array

  if (error) {
    console.error("Error fetching today's attendance:", error.message);
    // Optionally, display an error message to the user on the page
    // For now, returning null will let ClockInOut component show "Not Clocked In"
    return null;
  }
  return data as AttendanceRecord | null; // data can be null if maybeSingle() finds no record
}

export default async function AttendancePage() {
  const todaysAttendance = await getTodaysAttendance();

  return (
        <div className="p-4 sm:p-6 space-y-8"> {/* Increased overall spacing */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Attendance</h1>
            <p className="text-sm text-gray-500">Clock in or out for the day and view your attendance history below.</p>
          </div>
          <div className="max-w-md mx-auto lg:mx-0"> {/* Center on small, align left on larger screens within its grid area if any */}
            <ClockInOut initialTodaysAttendance={todaysAttendance} />
          </div>

          <AttendanceHistory /> {/* Add the history component here */}

          {/* Placeholder for listing more attendance history or other content */}
          {/*
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600">Your past 7 days of attendance will show here...</p>
            </div>
          </div>
          */}
        </div>
      );
    }
