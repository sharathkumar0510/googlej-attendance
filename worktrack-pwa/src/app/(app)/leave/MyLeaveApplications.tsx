// src/app/(app)/leave/MyLeaveApplications.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { LeaveApplication } from './types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
// useRouter is not strictly needed here if parent page handles refresh, but can be used for other navigations.
// import { useRouter } from 'next/navigation';

interface MyLeaveApplicationsProps {
  initialApplications: LeaveApplication[];
}

const getStatusClass = (status: LeaveApplication['status'] | string) => { // Ensure status type safety
    switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'approved': return 'bg-green-100 text-green-800 border-green-300';
        case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
        case 'cancelled': return 'bg-gray-200 text-gray-700 border-gray-300'; // Darker gray for cancelled
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export function MyLeaveApplications({ initialApplications }: MyLeaveApplicationsProps) {
  const [applications, setApplications] = useState<LeaveApplication[]>(initialApplications);
  // Per-application loading state for cancellation
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();
  // const router = useRouter(); // Uncomment if direct navigation is needed

  // Effect to update applications if the initialApplications prop changes (e.g., after router.refresh() in parent)
  useEffect(() => {
    setApplications(initialApplications);
  }, [initialApplications]);

  const handleCancelApplication = async (applicationId: string) => {
    if (!window.confirm('Are you sure you want to cancel this leave application? This action cannot be undone.')) return;

    setIsLoading(prev => ({ ...prev, [applicationId]: true }));
    setError(null);

    const { error: updateError } = await supabase
      .from('leave_applications')
      .update({ status: 'cancelled' })
      .eq('id', applicationId)
      .eq('status', 'pending'); // RLS on backend also enforces this, but good to be specific

    if (updateError) {
      setError(`Failed to cancel application: ${updateError.message}`);
      // Potentially show error for specific application:
      // setApplicationErrors(prev => ({...prev, [applicationId]: updateError.message}));
    } else {
      // Optimistically update local state
      setApplications(prevApps => prevApps.map(app =>
        app.id === applicationId ? { ...app, status: 'cancelled' as LeaveApplication['status'] } : app
      ));
      // router.refresh(); // Alternative: force full refresh if optimistic update is complex or has side effects
      setError(null); // Clear general error on success
    }
    setIsLoading(prev => ({ ...prev, [applicationId]: false }));
  };

  if (applications.length === 0) {
    return <p className="text-gray-600 mt-6 text-center py-4">You have no leave applications yet.</p>;
  }

  return (
    <div className="mt-8 lg:mt-0 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">My Leave Applications</h2>
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mb-3 border border-red-300">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.map(app => (
              <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{app.leave_types?.name || 'N/A'}</td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">
                  {new Date(app.start_date).toLocaleDateString()} - {new Date(app.end_date).toLocaleDateString()}
                </td>
                <td className="px-3 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={app.reason}>{app.reason}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusClass(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm">
                  {app.status === 'pending' && (
                    <button
                      onClick={() => handleCancelApplication(app.id)}
                      disabled={isLoading[app.id]}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1 px-2 rounded-md shadow-sm hover:shadow transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading[app.id] ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                  {(app.status === 'approved' || app.status === 'rejected' || app.status === 'cancelled') && (
                    <span className="italic text-xs text-gray-400">No actions</span>
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
