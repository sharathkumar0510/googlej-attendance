// src/app/(app)/(admin)/attendance/types.ts

// We can re-use the existing AttendanceRecord from employee's view if it's compatible
// and add user_full_name when transforming data from Supabase.
// However, for clarity in the Admin section, we'll define AdminAttendanceRecord.
// It extends the base structure or redefines it.

export type AdminAttendanceRecord = {
  id: string; // from attendance table
  user_id: string; // from attendance table
  clock_in_time: string; // from attendance table
  clock_out_time: string | null; // from attendance table
  date: string; // from attendance table
  notes: string | null; // from attendance table

  // Populated from a join with user_profiles or a mapping after fetching
  user_full_name: string; // Made non-optional after mapping, will default to 'N/A' or user_id if name is null

  // Optional: Include location fields if they need to be displayed in admin view
  clock_in_latitude?: number | null;
  clock_in_longitude?: number | null;
  clock_out_latitude?: number | null;
  clock_out_longitude?: number | null;

  // Optional: Include created_at/updated_at if relevant for admin view
  created_at?: string;
  updated_at?: string;
};

// Basic user profile structure for filter dropdowns or display
export type UserProfileBasic = {
    id: string; // user_id
    full_name: string | null;
};
