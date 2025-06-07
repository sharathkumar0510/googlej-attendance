// src/app/(app)/(admin)/layout.tsx
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import React from 'react';

// Helper function to get user with role
async function getUserWithRole() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore); // Uses the version that takes cookieStore directly
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    console.error('Session error or no session:', sessionError);
    return null;
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select(`
      id,
      full_name,
      role_id,
      roles ( id, name )
    `)
    .eq('id', session.user.id)
    .single();

  if (profileError || !userProfile) {
    console.error('Error fetching user profile or profile not found:', profileError);
    // If profile not found, it could be a new user whose profile hasn't been created by the trigger yet,
    // or a genuine error. For admin access, we must assume no profile means no admin rights.
    return { ...session.user, profile: null }; // Return user but with null profile
  }

  // Type assertion for roles relationship
  const typedUserProfile = userProfile as {
    id: string;
    full_name: string | null;
    role_id: string | null;
    roles: { id: string; name: string; } | null; // Supabase returns related record or null
  };

  return { ...session.user, profile: typedUserProfile };
}


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserWithRole();

  // Check if user exists, profile exists, role exists, and role name is 'Admin'
  if (!user || !user.profile || !user.profile.roles || user.profile.roles.name !== 'Admin') {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="mb-4">You do not have permission to view this page. This section is for Administrators only.</p>
        <Link href="/(app)/dashboard" className="text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="m-2 border rounded-lg">
      <div className="p-4 bg-slate-100 border-b rounded-t-lg">
        <h1 className="text-xl font-semibold">Admin Panel</h1>
        {/* You can add Admin specific horizontal navigation here if needed */}
        {/* e.g. <AdminTabs /> */}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
