// src/app/(app)/attendance/AttendanceHistory.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React, { useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord } from './types';

const ITEMS_PER_PAGE = 10;

export function AttendanceHistory() {
  const supabase = createSupabaseBrowserClient();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true); // True initially to show loading state
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      } else {
        setError("User not authenticated. Cannot fetch history.");
        setIsLoading(false); // Stop loading if user not found
      }
    };
    getCurrentUser();
  }, [supabase]);

  const fetchAttendanceRecords = useCallback(async () => {
    if (!userId) {
      // If userId is not yet set, don't attempt to fetch.
      // setIsLoading(false) will be handled by the useEffect that calls this, or initial state.
      return;
    }

    setIsLoading(true);
    setError(null);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error: fetchError, count } = await supabase
      .from('attendance')
      .select('*', { count: 'exact' }) // Request total count for pagination
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('clock_in_time', { ascending: false }) // Secondary sort for multiple entries on same day
      .range(from, to);

    if (fetchError) {
      setError(fetchError.message);
      setAttendanceRecords([]); // Clear records on error
    } else {
      setAttendanceRecords(data as AttendanceRecord[]);
      setTotalRecords(count || 0);
    }
    setIsLoading(false);
  }, [supabase, userId, currentPage]); // currentPage is a dependency now

  useEffect(() => {
    // Only fetch if userId is available.
    // If userId is null (still loading or auth error), fetchAttendanceRecords will return early.
    fetchAttendanceRecords();
  }, [userId, currentPage, fetchAttendanceRecords]); // fetchAttendanceRecords is stable due to useCallback

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  const formatDuration = (startTime: string, endTime: string | null): string => {
    if (!endTime) return 'N/A';
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;

    if (durationMs < 0) return 'Invalid';

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Initial loading state before userId is fetched or first fetch completes
  if (isLoading && userId === null && attendanceRecords.length === 0) {
    return <p className="text-center text-gray-500 py-4">Loading user information...</p>;
  }
  if (isLoading && attendanceRecords.length === 0) {
    return <p className="text-center text-gray-500 py-4">Loading attendance history...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 bg-red-50 p-3 rounded-md">Error fetching attendance: {error}</p>;
  }

  if (attendanceRecords.length === 0 && !isLoading) {
    return <p className="text-center text-gray-600 py-4">No attendance records found.</p>;
  }

  return (
    <div className="mt-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">My Attendance History</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock In</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clock Out</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendanceRecords.map(record => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(record.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {new Date(record.clock_in_time).toLocaleTimeString()}
                  {record.clock_in_latitude && record.clock_in_longitude && <span className="text-xs block text-gray-400">Loc: {record.clock_in_latitude.toFixed(2)},{record.clock_in_longitude.toFixed(2)}</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString() : <span className="italic text-gray-400">N/A</span>}
                  {record.clock_out_latitude && record.clock_out_longitude && <span className="text-xs block text-gray-400">Loc: {record.clock_out_latitude.toFixed(2)},{record.clock_out_longitude.toFixed(2)}</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDuration(record.clock_in_time, record.clock_out_time)}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate" title={record.notes || undefined}>{record.notes || <span className="italic text-gray-400">N/A</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Next
            </button>
          </div>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages} <span className="hidden sm:inline">| Total Records: {totalRecords}</span>
          </span>
        </div>
      )}
    </div>
  );
}
