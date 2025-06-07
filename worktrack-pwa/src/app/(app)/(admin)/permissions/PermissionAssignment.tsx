// src/app/(app)/(admin)/permissions/PermissionAssignment.tsx
'use client';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import React, { useState, useEffect, useMemo } from 'react';
import type { RoleWithPermissions, Permission } from './page';

interface PermissionAssignmentProps {
  initialRoles: RoleWithPermissions[];
  allPermissions: Permission[];
}

export function PermissionAssignment({ initialRoles, allPermissions }: PermissionAssignmentProps) {
  const supabase = createSupabaseBrowserClient();
  const [roles, setRoles] = useState<RoleWithPermissions[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    initialRoles.length > 0 ? initialRoles[0].id : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isToggling, setIsToggling] = useState<Record<string, boolean>>({}); // For individual checkbox loading
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Update roles if initialRoles prop changes
  useEffect(() => {
    setRoles(initialRoles);
    if (!selectedRoleId && initialRoles.length > 0) {
      setSelectedRoleId(initialRoles[0].id);
    } else if (initialRoles.length === 0) {
      setSelectedRoleId(null);
    }
  }, [initialRoles, selectedRoleId]);


  const currentRolePermissions = useMemo(() => {
    if (!selectedRoleId) return {};
    const selectedRole = roles.find(r => r.id === selectedRoleId);
    const permissionsMap: Record<string, boolean> = {};
    allPermissions.forEach(p => {
      permissionsMap[p.id] = selectedRole?.permissions.some(rp => rp.id === p.id) || false;
    });
    return permissionsMap;
  }, [selectedRoleId, roles, allPermissions]);

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoleId(event.target.value);
    setError(null);
    setMessage(null);
  };

  const handlePermissionToggle = async (permissionId: string) => {
    if (!selectedRoleId) return;

    setIsToggling(prev => ({ ...prev, [permissionId]: true }));
    setError(null);
    setMessage(null);

    const isCurrentlyAssigned = currentRolePermissions[permissionId];
    let operationError = null;
    let successMessage = '';

    if (isCurrentlyAssigned) {
      // Delete permission from role_permissions
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .match({ role_id: selectedRoleId, permission_id: permissionId });
      operationError = deleteError;
      if(!operationError) successMessage = `Permission removed successfully.`;
    } else {
      // Add permission to role_permissions
      const { error: insertError } = await supabase
        .from('role_permissions')
        .insert([{ role_id: selectedRoleId, permission_id: permissionId }]);
      operationError = insertError;
      if(!operationError) successMessage = `Permission assigned successfully.`;
    }

    if (operationError) {
      setError(operationError.message);
    } else {
      setMessage(successMessage);
      // Update local state for immediate feedback
      // This ensures the UI reflects the change without a full refetch from server
      setRoles(prevRoles =>
        prevRoles.map(r => {
          if (r.id === selectedRoleId) {
            const newPermissions = isCurrentlyAssigned
              ? r.permissions.filter(p => p.id !== permissionId)
              // Ensure the added permission has both id and name
              : [...r.permissions, allPermissions.find(p => p.id === permissionId)! as {id: string, name: string}];
            return { ...r, permissions: newPermissions };
          }
          return r;
        })
      );
    }
    setIsToggling(prev => ({ ...prev, [permissionId]: false }));
  };

  const selectedRoleDetails = roles.find(r => r.id === selectedRoleId);

  if (roles.length === 0) {
    return <p className="text-gray-600">No roles found. Please create roles first in the 'Manage Roles' section.</p>;
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded mb-4 border border-red-300">{error}</p>}
      {message && <p className="text-sm text-green-600 bg-green-100 p-3 rounded mb-4 border border-green-300">{message}</p>}

      <div>
        <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Role to Manage Permissions:</label>
        <select
          id="roleSelect"
          value={selectedRoleId || ''}
          onChange={handleRoleChange}
          disabled={isLoading} // Disable if globally loading roles (not implemented here, but good for future)
          className="block w-full max-w-md p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>

      {selectedRoleId && selectedRoleDetails && (
        <div className="pt-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">
            Permissions for Role: <span className="font-bold text-indigo-600">{selectedRoleDetails.name}</span>
          </h3>
          {selectedRoleDetails.name === 'Admin' ? (
            <p className="text-sm text-gray-600 italic bg-blue-50 p-3 rounded-md border border-blue-200">
              The 'Admin' role typically has all permissions implicitly granted via system design (e.g., RLS bypass or hardcoded checks).
              Assignments here might be for record-keeping or if not all permissions are hardcoded for the Admin role.
              Modifying these might not change Admin capabilities if they are hardcoded.
            </p>
          ) : (
            allPermissions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                {allPermissions.map(permission => (
                  <div key={permission.id} className="p-3 border rounded-lg bg-white shadow hover:shadow-md transition-shadow">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-medium text-sm text-gray-700">{permission.name}</span>
                      <input
                        type="checkbox"
                        checked={currentRolePermissions[permission.id] || false}
                        onChange={() => handlePermissionToggle(permission.id)}
                        disabled={isToggling[permission.id] || isLoading}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
                      />
                    </label>
                    {permission.description && (
                      <p className="text-xs text-gray-500 mt-1.5">{permission.description}</p>
                    )}
                    {isToggling[permission.id] && <p className="text-xs text-indigo-500 mt-1">Processing...</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No permissions have been defined in the system yet.</p>
            )
          )}
        </div>
      )}
       {!selectedRoleId && roles.length > 0 && (
         <p className="text-gray-600">Select a role from the dropdown to manage its permissions.</p>
       )}
    </div>
  );
}
