// src/app/(app)/attendance/types.ts
export type AttendanceRecord = {
  id: string; // UUID
  user_id: string; // UUID, links to auth.users
  clock_in_time: string; // TIMESTAMPTZ
  clock_out_time: string | null; // TIMESTAMPTZ, nullable
  clock_in_latitude: number | null; // NUMERIC, nullable
  clock_in_longitude: number | null; // NUMERIC, nullable
  clock_out_latitude: number | null; // NUMERIC, nullable
  clock_out_longitude: number | null; // NUMERIC, nullable
  date: string; // DATE (YYYY-MM-DD format)
  notes: string | null; // TEXT, nullable
  created_at?: string; // TIMESTAMPTZ, from Supabase table defaults
  updated_at?: string; // TIMESTAMPTZ, from Supabase table defaults/trigger
};
