// src/app/(app)/(admin)/roles/RoleManagementActions.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React, { useState, FormEvent, useEffect } from 'react'; // Added useEffect
import type { Role } from './page'; // Import type from server component

interface RoleManagementActionsProps {
  initialRoles: Role[];
}

export function RoleManagementActions({ initialRoles }: RoleManagementActionsProps) {
  const supabase = createSupabaseBrowserClient();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  // To keep client state in sync if initialRoles prop changes (e.g. after server action revalidation)
  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  const resetForm = () => {
    setRoleName('');
    setRoleDescription('');
    setEditingRole(null);
    setShowForm(false);
    setError(null);
    // Keep message for a bit for user to see, or clear it: setMessage(null);
  };

  const fetchRoles = async ()_InternalLinked4739c741f6114c897189658a916097c => { // Renamed from _InternalLinked4739c741f6114c897189658a916097c
    setIsLoading(true);
    const { data, error: fetchError } = await supabase.from('roles').select('*').order('name');
    if (fetchError) {
      setError(fetchError.message);
      setRoles(initialRoles); // Reset to initial on error or keep current?
    } else {
      setRoles(data as Role[]);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    if (!roleName.trim()) {
        setError("Role name cannot be empty.");
        setIsLoading(false);
        return;
    }

    let operationError = null;

    if (editingRole) { // Update
      const { error: updateError } = await supabase
        .from('roles')
        .update({ name: roleName, description: roleDescription })
        .eq('id', editingRole.id);
      operationError = updateError;
      if (!updateError) setMessage('Role updated successfully!');
    } else { // Create
      const { error: createError } = await supabase
        .from('roles')
        .insert([{ name: roleName, description: roleDescription }])
        .select(); // .select() can help confirm the insert or get the new row
      operationError = createError;
      if (!createError) setMessage('Role created successfully!');
    }

    if (operationError) {
      setError(operationError.message);
    } else {
      await fetchRoles(); // Refetch to get the latest list including the new/updated one
      resetForm();
    }
    setIsLoading(false);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setShowForm(true);
    setError(null);
    setMessage(null); // Clear previous messages when opening form
  };

  const handleDelete = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone and might affect users assigned to this role.')) {
        return;
    }
    setIsLoading(true);
    setError(null);
    setMessage(null);
    const { error: deleteError } = await supabase.from('roles').delete().eq('id', roleId);
    if (deleteError) {
        setError(deleteError.message);
    } else {
        setMessage('Role deleted successfully.');
        // Optimistic update or refetch
        setRoles(prevRoles => prevRoles.filter(r => r.id !== roleId));
        // await fetchRoles(); // Or refetch, but optimistic is faster UI feedback
    }
    setIsLoading(false);
  };

  // Core roles that should not be deleted
  const coreRoles = ['Admin', 'Supervisor', 'Employee'];


  return (
    <div>
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded mb-4 border border-red-300">{error}</p>}
      {message && <p className="text-sm text-green-600 bg-green-100 p-3 rounded mb-4 border border-green-300">{message}</p>}

      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditingRole(null); setRoleName(''); setRoleDescription(''); setError(null); setMessage(null); }}
          className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-shadow"
        >
          Create New Role
        </button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 sm:p-6 border rounded-lg bg-gray-50 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
          <div className="mb-4">
            <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input
              id="roleName"
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., Editor, Viewer"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              id="roleDescription"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Briefly describe what this role can do"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow-md hover:shadow-lg transition-shadow disabled:opacity-70"
            >
              {isLoading ? (editingRole ? 'Updating...' : 'Saving...') : (editingRole ? 'Update Role' : 'Save Role')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 shadow-sm hover:shadow transition-shadow"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <h3 className="text-lg font-semibold mb-3 text-gray-800">Existing Roles</h3>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {roles.length > 0 ? roles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 whitespace-nowrap">{role.name}</td>
                <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">{role.description || '-'}</td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(role)}
                    className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded shadow hover:shadow-md transition-all mr-2"
                  >
                    Edit
                  </button>
                  {!coreRoles.includes(role.name) && (
                     <button
                        onClick={() => handleDelete(role.id)}
                        disabled={isLoading}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded shadow hover:shadow-md transition-all disabled:opacity-70"
                     >
                        Delete
                     </button>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="py-4 px-4 text-center text-gray-500">
                  {isLoading ? 'Loading roles...' : 'No roles found. Create one to get started!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
