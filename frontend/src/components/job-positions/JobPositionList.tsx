/**
 * JobPositionList Component
 * Displays list of job positions with filtering and actions
 */

'use client';

import { useEffect, useState } from 'react';
import { useJobPosition, getJobPositionColor } from '@/hooks/useJobPosition';
import { JobPosition } from '@/api/jobPositionApi';

interface JobPositionListProps {
  departmentId?: number;
  showInactive?: boolean;
  onPositionSelect?: (position: JobPosition) => void;
}

export function JobPositionList({
  departmentId,
  showInactive = false,
  onPositionSelect,
}: JobPositionListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    items: positions,
    isLoading,
    error,
    loadAll,
    search,
    getByDepartment,
  } = useJobPosition({
    onError: (err) => {
      console.error('Job position error:', err.message);
    },
  });

  // Load job positions on mount and when filters change
  useEffect(() => {
    const loadPositions = async () => {
      const filters: any = {};

      if (!showInactive) {
        filters.is_active = 'true';
      }

      if (departmentId) {
        await getByDepartment(departmentId, filters);
      } else {
        await loadAll(filters);
      }
    };

    loadPositions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentId, showInactive]);

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      // If search is cleared, reload all positions
      if (departmentId) {
        await getByDepartment(departmentId, {
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
        <p className="text-red-600">Error loading job positions: {error.message}</p>
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
          placeholder="Search job positions by name..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {(isLoading || isSearching) && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Job Position List */}
      {!isLoading && !isSearching && (
        <>
          {positions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No job positions found matching your search' : 'No job positions found'}
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
                      Department
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
                  {positions.map((position) => (
                    <tr
                      key={position.id}
                      onClick={() => onPositionSelect?.(position)}
                      className={`
                        transition-colors duration-150
                        ${onPositionSelect ? 'cursor-pointer hover:bg-blue-50' : ''}
                        ${!position.is_active ? 'opacity-60' : ''}
                      `}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{position.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {position.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {position.department?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: getJobPositionColor(position) }}
                          />
                          <span className="text-xs text-gray-500 font-mono">
                            {getJobPositionColor(position)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`
                            px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              position.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          `}
                        >
                          {position.is_active ? 'Active' : 'Inactive'}
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
      {!isLoading && !isSearching && positions.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {positions.length} job position{positions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
