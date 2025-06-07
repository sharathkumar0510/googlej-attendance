// src/app/(app)/(admin)/users/UserRoleAssignment.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React, { useState, useEffect } from 'react';
import type { UserProfileWithRole, Role } from './page'; // Import types

interface UserRoleAssignmentProps {
  initialUsers: UserProfileWithRole[];
  allRoles: Role[];
}

export function UserRoleAssignment({ initialUsers, allRoles }: UserRoleAssignmentProps) {
  const supabase = createSupabaseBrowserClient();
  const [users, setUsers] = useState<UserProfileWithRole[]>(initialUsers);
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({}); // loading state per user
  const [error, setError] = useState<string | null>(null); // General error for the component
  const [userMessage, setUserMessage] = useState<Record<string, { text: string | null, type: 'success' | 'error' }>>({});

  const [currentSessionUserId, setCurrentSessionUserId] = useState<string | null>(null);

  useEffect(() => {
    setUsers(initialUsers); // Sync with server component data if it changes
  }, [initialUsers]);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentSessionUserId(user?.id || null);
    };
    getCurrentUser();
  }, [supabase]);


  const handleRoleChange = async (userId: string, newRoleId: string | null) => {
    if (userId === currentSessionUserId && users.find(u=>u.id === userId)?.roles?.name === 'Admin') {
        setUserMessage(prev => ({ ...prev, [userId]: {text: "Admins cannot change their own role via this UI.", type: 'error' }}));
        // Optionally revert the select dropdown if needed, though RLS should be the true guard.
        // For now, the select will show the new value but the update won't proceed if RLS prevents it.
        // A more robust UI would re-fetch the user's actual role or prevent selection.
        setTimeout(() => setUserMessage(prev => ({ ...prev, [userId]: {text: null, type: 'error'}})), 4000);
        return;
    }

    setIsLoading(prev => ({ ...prev, [userId]: true }));
    setError(null); // Clear general error
    setUserMessage(prev => ({ ...prev, [userId]: {text: null, type: 'error'} }));


    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ role_id: newRoleId })
      .eq('id', userId)
      .select('id, role_id, roles (id, name)') // Select updated data to confirm
      .single(); // Expect a single row back

    if (updateError) {
      console.error('Error updating role:', updateError);
      setError(`Failed to update role for user ${users.find(u=>u.id === userId)?.full_name || userId}.`);
      setUserMessage(prev => ({ ...prev, [userId]: {text: updateError.message, type: 'error' }}));
    } else if (updatedProfile) {
      setUserMessage(prev => ({ ...prev, [userId]: {text: 'Role updated successfully!', type: 'success' }}));
      // Update local state for immediate feedback
      setUsers(prevUsers => prevUsers.map(u =>
        u.id === userId
        ? { ...u, role_id: updatedProfile.role_id, roles: updatedProfile.roles as UserProfileWithRole['roles'] }
        : u
      ));
    }

    // Clear message after a few seconds
    setTimeout(() => setUserMessage(prev => ({ ...prev, [userId]: {text: null, type: 'error'}})), 3000);
    setIsLoading(prev => ({ ...prev, [userId]: false }));
  };

  if (users.length === 0) {
    return <p className="p-4 text-gray-600">No users found in the system.</p>;
  }
  if (allRoles.length === 0) {
    return <p className="p-4 text-gray-600">No roles found. Please define roles before assigning them.</p>;
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded border border-red-300">{error}</p>}

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {/* <th className="py-3 px-4 border-b text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User ID</th> */}
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Current Role</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Assign New Role</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                {/* <td className="py-2 px-4 text-xs text-gray-500">{user.id}</td> */}
                <td className="py-3 px-4 whitespace-nowrap">{user.full_name || 'N/A'}</td>
                <td className="py-3 px-4 whitespace-nowrap">{user.roles?.name || <span className="italic text-gray-400">No Role</span>}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {user.id === currentSessionUserId && user.roles?.name === 'Admin' ? (
                    <span className="text-sm italic text-gray-500">Cannot change own Admin role here</span>
                  ) : (
                    <select
                      value={user.role_id || ''} // Use empty string for "No Role" option if role_id is null
                      onChange={(e) => handleRoleChange(user.id, e.target.value || null)} // Pass null if empty string selected
                      disabled={isLoading[user.id]}
                      className="block w-full p-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:opacity-70"
                    >
                      <option value="">No Role</option>
                      {allRoles.map(role => (
                        <option key={role.id} value={role.id} disabled={role.name === 'Admin' && user.id !== currentSessionUserId}>
                          {/* Prevent assigning 'Admin' to other users if current user is not Admin (conceptual) */}
                          {/* This specific disable logic might be too complex for here or not needed if RLS handles it */}
                          {role.name}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="py-3 px-4 whitespace-nowrap text-sm">
                    {isLoading[user.id] && <span className="text-blue-600">Saving...</span>}
                    {userMessage[user.id]?.text && (
                        <span className={userMessage[user.id]?.type === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {userMessage[user.id]?.text}
                        </span>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
