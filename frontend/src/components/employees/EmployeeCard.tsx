/**
 * EmployeeCard Component
 * Displays individual employee information in a card format
 */

'use client';

import { Employee } from '@/api/employeeApi';
import { getEmployeeFullName } from '@/hooks/useEmployee';

interface EmployeeCardProps {
  employee: Employee;
  onClick?: () => void;
}

export function EmployeeCard({ employee, onClick }: EmployeeCardProps) {
  const fullName = getEmployeeFullName(employee);

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-purple-100 text-purple-800';
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800';
      case 'MANAGER':
        return 'bg-green-100 text-green-800';
      case 'EMPLOYEE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 shadow-sm
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}
        ${!employee.is_active ? 'opacity-60' : ''}
      `}
    >
      {/* Header with name and status */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
          {employee.user?.email && (
            <p className="text-sm text-gray-500">{employee.user.email}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {/* Active Status */}
          <span
            className={`
              px-2 py-1 text-xs font-medium rounded-full
              ${employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
            `}
          >
            {employee.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Employee Details */}
      <div className="space-y-2">
        {/* Company Role */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Role:</span>
          <span
            className={`
              px-2 py-0.5 text-xs font-medium rounded
              ${getRoleBadgeColor(employee.company_role)}
            `}
          >
            {employee.company_role}
          </span>
        </div>

        {/* Position */}
        {employee.position && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Position:</span>
            <span className="text-sm font-medium text-gray-900">{employee.position}</span>
          </div>
        )}

        {/* Department */}
        {employee.department && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Department:</span>
            <span className="text-sm font-medium text-gray-900">{employee.department.name}</span>
          </div>
        )}

        {/* Job Position */}
        {employee.job_position && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Job:</span>
            <span className="text-sm font-medium text-gray-900">
              {employee.job_position.name}
            </span>
          </div>
        )}

        {/* Location */}
        {employee.location && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Location:</span>
            <span className="text-sm font-medium text-gray-900">{employee.location.name}</span>
          </div>
        )}
      </div>

      {/* Footer with ID (for debugging) */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">ID: {employee.id}</span>
      </div>
    </div>
  );
}
