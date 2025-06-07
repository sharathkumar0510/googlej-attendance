// src/app/(app)/(admin)/attendance/AllAttendanceView.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React, { useState, useEffect, useCallback } from 'react';
import type { AdminAttendanceRecord, UserProfileBasic } from './types';

const ITEMS_PER_PAGE = 15;

interface AllAttendanceViewProps {
  usersForFilter: UserProfileBasic[];
}

export function AllAttendanceView({ usersForFilter }: AllAttendanceViewProps) {
  const supabase = createSupabaseBrowserClient();
  const [attendanceRecords, setAttendanceRecords] = useState<AdminAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as false, true during fetch
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter states
  const [selectedUserId, setSelectedUserId] = useState<string>(''); // '' for all users
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const fetchAttendance = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);

    let query = supabase
      .from('attendance')
      .select(`
        id,
        user_id,
        clock_in_time,
        clock_out_time,
        date,
        notes,
        clock_in_latitude,
        clock_in_longitude,
        clock_out_latitude,
        clock_out_longitude,
        user_profiles (full_name)
      `, { count: 'exact' });

    if (selectedUserId) {
      query = query.eq('user_id', selectedUserId);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const from = (pageToFetch - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    query = query
      .order('date', { ascending: false })
      .order('clock_in_time', { ascending: false })
      .range(from, to);

    const { data, error: fetchError, count } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setAttendanceRecords([]);
    } else {
      const formattedData = data?.map(item => ({
        ...item,
        // Asserting user_profiles type if Supabase client typings are generic for joins
        user_full_name: (item.user_profiles as { full_name: string | null } | null)?.full_name || 'N/A',
      })) || [];
      setAttendanceRecords(formattedData as AdminAttendanceRecord[]);
      setTotalRecords(count || 0);
    }
    setIsLoading(false);
  }, [supabase, selectedUserId, startDate, endDate]); // Removed currentPage from here

  useEffect(() => {
    fetchAttendance(currentPage);
  }, [fetchAttendance, currentPage]); // fetchAttendance will change if filters change, triggering re-fetch

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page
    // fetchAttendance(1) will be called by the useEffect above due to currentPage change (if it does change)
    // or if filters changed, fetchAttendance itself changes, triggering useEffect.
    // To ensure fetch on submit if currentPage is already 1 but filters changed:
    if (currentPage === 1) {
        fetchAttendance(1);
    }
  };

  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  const formatDuration = (startTime: string, endTime: string | null): string => {
    if (!endTime) return 'N/A';
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const durationMs = end - start;
    if (durationMs < 0) return <span className="text-orange-500">Invalid</span> as unknown as string; // Or some indicator
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg space-y-6">
      <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div>
          <label htmlFor="userFilter" className="block text-sm font-medium text-gray-700 mb-1">User</label>
          <select
            id="userFilter"
            value={selectedUserId}
            onChange={(e) => { setSelectedUserId(e.target.value); setCurrentPage(1);}} // Reset page on filter change
            className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">All Users</option>
            {usersForFilter.map(user => (
              <option key={user.id} value={user.id}>{user.full_name || user.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1);}} // Reset page
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1);}} // Reset page
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="h-10 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-60"
        >
          {isLoading ? 'Filtering...' : 'Apply Filters'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded border border-red-300">Error: {error}</p>}

      {isLoading && attendanceRecords.length === 0 && <p className="text-center text-gray-500 py-4">Loading attendance records...</p>}
      {!isLoading && totalRecords === 0 && <p className="text-center text-gray-600 py-4">No attendance records found for the selected filters.</p>}

      {totalRecords > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{record.user_full_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{new Date(record.clock_in_time).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{record.clock_out_time ? new Date(record.clock_out_time).toLocaleTimeString() : <span className="italic text-gray-400">N/A</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDuration(record.clock_in_time, record.clock_out_time)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate" title={record.notes || undefined}>{record.notes || <span className="italic text-gray-400">N/A</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
          <div className="flex space-x-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Previous</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">Next</button>
          </div>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages} <span className="hidden sm:inline">| Total Records: {totalRecords}</span>
          </span>
        </div>
      )}
    </div>
  );
}
