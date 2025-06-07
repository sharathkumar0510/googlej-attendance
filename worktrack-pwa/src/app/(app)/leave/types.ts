// src/app/(app)/leave/types.ts
export type LeaveType = {
  id: string;
  name: string;
  default_balance: number;
};

export type LeaveApplication = {
  id: string; // UUID
  user_id: string; // UUID, links to auth.users
  leave_type_id: string; // UUID, links to leave_types
  start_date: string; // ISO string date YYYY-MM-DD
  end_date: string;   // ISO string date YYYY-MM-DD
  reason: string;     // TEXT
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'; // TEXT
  approved_by?: string | null; // UUID, links to auth.users (approver)
  comments?: string | null;    // TEXT, comments from approver
  requested_at?: string; // TIMESTAMPTZ, from Supabase table defaults
  updated_at?: string;   // TIMESTAMPTZ, from Supabase table defaults/trigger

  // For displaying joined data in UI components
  leave_types?: { name: string }; // Populated from join with leave_types
  // user_profiles field might be used in admin/supervisor views, not typically for employee's own view of their requests.
  // user_profiles?: { full_name: string | null };
};
