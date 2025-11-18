/**
 * DepartmentList Component
 * Displays list of departments with filtering and actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useDepartment, getDepartmentColor } from '@/hooks/useDepartment';
import { Department } from '@/api/departmentApi';

interface DepartmentListProps {
  locationId?: number;
  showInactive?: boolean;
  onDepartmentSelect?: (department: Department) => void;
}

export function DepartmentList({
  locationId,
  showInactive = false,
  onDepartmentSelect,
}: DepartmentListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    items: departments,
    isLoading,
    error,
    loadAll,
    search,
    getByLocation,
  } = useDepartment({
    onError: (err) => {
      console.error('Department error:', err.message);
    },
  });

  // Load departments on mount and when filters change
  useEffect(() => {
    const loadDepartments = async () => {
      const filters: any = {};

      if (!showInactive) {
        filters.is_active = 'true';
      }

      if (locationId) {
        await getByLocation(locationId, filters);
      } else {
        await loadAll(filters);
      }
    };

    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId, showInactive]);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is cleared, reload all departments
      if (locationId) {
        await getByLocation(locationId, {
          is_active: showInactive ? undefined : 'true',
        });
      } else {
        await loadAll({
          is_active: showInactive ? undefined : 'true',
        });
      }
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    await search(query, {
      is_active: showInactive ? undefined : 'true',
    });
    setIsSearching(false);
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error loading departments: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search departments by name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {(isLoading || isSearching) && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Department List */}
      {!isLoading && !isSearching && (
        <>
          {departments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No departments found matching your search' : 'No departments found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((department) => (
                    <tr
                      key={department.id}
                      onClick={() => onDepartmentSelect?.(department)}
                      className={`
                        transition-colors duration-150
                        ${onDepartmentSelect ? 'cursor-pointer hover:bg-blue-50' : ''}
                        ${!department.is_active ? 'opacity-60' : ''}
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{department.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {department.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {department.location?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: getDepartmentColor(department) }}
                          />
                          <span className="text-xs text-gray-500 font-mono">
                            {getDepartmentColor(department)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`
                            px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              department.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          `}
                        >
                          {department.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Results Count */}
      {!isLoading && !isSearching && departments.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {departments.length} department{departments.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
