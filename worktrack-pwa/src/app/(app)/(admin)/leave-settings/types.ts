// src/app/(app)/(admin)/leave-settings/types.ts
export type LeaveType = {
  id: string; // UUID
  name: string;
  default_balance: number; // Integer
  created_at?: string; // TIMESTAMPTZ, from Supabase table defaults
  // updated_at could also be here if you have an update trigger for leave_types
};
