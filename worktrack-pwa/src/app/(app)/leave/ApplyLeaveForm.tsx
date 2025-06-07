// src/app/(app)/leave/ApplyLeaveForm.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React, { useState, FormEvent, useEffect } from 'react';
import type { LeaveType } from './types';
import { useRouter } from 'next/navigation';


interface ApplyLeaveFormProps {
  leaveTypes: LeaveType[];
  userId: string;
}

export function ApplyLeaveForm({ leaveTypes, userId }: ApplyLeaveFormProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  // Initialize leaveTypeId with the first available leave type's ID, or empty if none exist
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  useEffect(() => {
    if (leaveTypes.length > 0 && !leaveTypeId) {
      setLeaveTypeId(leaveTypes[0].id);
    }
  }, [leaveTypes, leaveTypeId]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!leaveTypeId) {
        setError('Please select a leave type.');
        setIsLoading(false);
        return;
    }
    if (!startDate || !endDate) {
        setError('Please select start and end dates.');
        setIsLoading(false);
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('End date cannot be before start date.');
      setIsLoading(false);
      return;
    }
    if (reason.trim() === '') {
        setError('Please provide a reason for your leave.');
        setIsLoading(false);
        return;
    }


    const { error: insertError } = await supabase
      .from('leave_applications')
      .insert([{
        user_id: userId,
        leave_type_id: leaveTypeId,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        status: 'pending', // Default status
      }]);

    if (insertError) {
      setError(`Failed to submit application: ${insertError.message}`);
    } else {
      setMessage('Leave application submitted successfully!');
      // Reset form fields
      if (leaveTypes.length > 0) setLeaveTypeId(leaveTypes[0].id); else setLeaveTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      // Programmatically refresh Server Components on the current route.
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Apply for Leave</h2>
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md mb-3 border border-red-300">{error}</p>}
      {message && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md mb-3 border border-green-300">{message}</p>}

      {leaveTypes.length === 0 ? (
        <p className="text-gray-600">No leave types available. Please contact an administrator.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="leaveType" className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
            <select
              id="leaveType"
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              required
              className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} (Bal: {lt.default_balance} days)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
            </div>
          </div>
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm" placeholder="Briefly explain the reason for your leave."></textarea>
          </div>
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:opacity-60"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
