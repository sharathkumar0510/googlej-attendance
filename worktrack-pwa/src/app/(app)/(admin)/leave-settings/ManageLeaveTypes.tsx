// src/app/(app)/(admin)/leave-settings/ManageLeaveTypes.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React, { useState, FormEvent, useEffect } from 'react';
import type { LeaveType } from './types';

interface ManageLeaveTypesProps {
  initialLeaveTypes: LeaveType[];
}

export function ManageLeaveTypes({ initialLeaveTypes }: ManageLeaveTypesProps) {
  const supabase = createSupabaseBrowserClient();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>(initialLeaveTypes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null);
  const [typeName, setTypeName] = useState('');
  const [typeBalance, setTypeBalance] = useState<number>(0); // Default to 0

  useEffect(() => {
    setLeaveTypes(initialLeaveTypes);
  }, [initialLeaveTypes]);

  const resetForm = () => {
    setTypeName('');
    setTypeBalance(0);
    setEditingLeaveType(null);
    setShowForm(false);
    setError(null);
    // setMessage(null); // Keep success/error messages for a bit for user visibility
  };

  const fetchAllLeaveTypes = async () => {
    setIsLoading(true); // Indicate loading while refetching
    const { data, error: fetchError } = await supabase
      .from('leave_types')
      .select('*')
      .order('name');

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLeaveTypes(data as LeaveType[]);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (typeName.trim() === '') {
      setError('Leave type name cannot be empty.');
      return;
    }
    if (typeBalance < 0) {
      setError('Default balance cannot be negative.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage(null);

    const upsertData = {
      name: typeName.trim(),
      default_balance: parseInt(String(typeBalance), 10) // Ensure it's an integer
    };
    let operationError = null;
    let successMessage = '';

    if (editingLeaveType) {
      const { error: updateError } = await supabase
        .from('leave_types')
        .update(upsertData)
        .eq('id', editingLeaveType.id);
      operationError = updateError;
      successMessage = 'Leave type updated successfully!';
    } else {
      const { error: createError } = await supabase
        .from('leave_types')
        .insert([upsertData]);
      operationError = createError;
      successMessage = 'Leave type created successfully!';
    }

    if (operationError) {
      setError(operationError.message);
    } else {
      setMessage(successMessage);
      await fetchAllLeaveTypes(); // Refresh the list
      resetForm(); // Hide form and clear fields
    }
    setIsLoading(false);
  };

  const handleEdit = (lt: LeaveType) => {
    setEditingLeaveType(lt);
    setTypeName(lt.name);
    setTypeBalance(lt.default_balance);
    setShowForm(true);
    setError(null);
    setMessage(null);
  };

  const handleDelete = async (leaveTypeId: string) => {
    if (!window.confirm('Are you sure you want to delete this leave type? This action cannot be undone and might affect existing leave applications if not handled carefully by the system (e.g. if ON DELETE RESTRICT is used).')) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    // Recommended: Check if any leave applications use this type before deleting.
    // const { count, error: checkError } = await supabase
    //   .from('leave_applications')
    //   .select('id', { count: 'exact', head: true })
    //   .eq('leave_type_id', leaveTypeId);

    // if (checkError) {
    //   setError(`Could not check usage: ${checkError.message}`);
    //   setIsLoading(false);
    //   return;
    // }
    // if (count && count > 0) {
    //   setError(`Cannot delete: This leave type is in use by ${count} application(s).`);
    //   setIsLoading(false);
    //   return;
    // }

    const { error: deleteError } = await supabase.from('leave_types').delete().eq('id', leaveTypeId);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      setMessage('Leave type deleted successfully.');
      // Optimistic update or refetch:
      setLeaveTypes(prevTypes => prevTypes.filter(lt => lt.id !== leaveTypeId));
      // await fetchAllLeaveTypes(); // Or refetch
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded border border-red-300">{error}</p>}
      {message && <p className="text-sm text-green-600 bg-green-100 p-3 rounded border border-green-300">{message}</p>}

      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditingLeaveType(null); setTypeName(''); setTypeBalance(0); setError(null); setMessage(null);}}
          className="mb-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-shadow"
        >
          Add New Leave Type
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50 shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-700">{editingLeaveType ? 'Edit Leave Type' : 'Add New Leave Type'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="typeName" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input id="typeName" type="text" value={typeName} onChange={(e) => setTypeName(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
            <div>
              <label htmlFor="typeBalance" className="block text-sm font-medium text-gray-700 mb-1">Default Balance (days)</label>
              <input id="typeBalance" type="number" min="0" value={typeBalance} onChange={(e) => setTypeBalance(Math.max(0, parseInt(e.target.value, 10) || 0))} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-5">
            <button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow-md disabled:opacity-70">
              {isLoading ? (editingLeaveType ? 'Updating...' : 'Saving...') : (editingLeaveType ? 'Update Type' : 'Save Type')}
            </button>
            <button type="button" onClick={resetForm} className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 shadow-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <h3 className="text-md font-semibold mb-3 text-gray-800">Existing Leave Types</h3>
        <table className="min-w-full table-auto border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Default Balance</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leaveTypes.map((lt) => (
              <tr key={lt.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">{lt.name}</td>
                <td className="px-4 py-2 whitespace-nowrap">{lt.default_balance} days</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <button onClick={() => handleEdit(lt)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-2 rounded shadow mr-2">Edit</button>
                  <button onClick={() => handleDelete(lt.id)} disabled={isLoading} className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded shadow disabled:opacity-70">Delete</button>
                </td>
              </tr>
            ))}
             {leaveTypes.length === 0 && !isLoading && (
                <tr><td colSpan={3} className="text-center py-4 text-gray-500">No leave types defined yet.</td></tr>
            )}
            {isLoading && leaveTypes.length === 0 && (
                <tr><td colSpan={3} className="text-center py-4 text-gray-500">Loading...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
