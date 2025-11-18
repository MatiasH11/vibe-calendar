'use client';

import { useState } from 'react';
import { ViewContainer } from '../ViewContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Building2, MapPin, Briefcase, Users } from 'lucide-react';

// Location components
import { LocationList } from '@/components/locations/LocationList';
import { LocationForm } from '@/components/locations/LocationForm';
import { Location } from '@/api/locationApi';

// Department components
import { DepartmentList } from '@/components/departments/DepartmentList';
import { DepartmentForm } from '@/components/departments/DepartmentForm';
import { Department } from '@/api/departmentApi';

// Job Position components
import { JobPositionList } from '@/components/job-positions/JobPositionList';
import { JobPositionForm } from '@/components/job-positions/JobPositionForm';
import { JobPosition } from '@/api/jobPositionApi';

// Employee components
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { Employee } from '@/api/employeeApi';

type EntityType = 'employee' | 'position' | 'department' | 'location';

export function AdministracionView() {
  const [activeTab, setActiveTab] = useState<EntityType>('employee');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Entity selection states
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<JobPosition | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Handle creating new entity
  const handleCreateNew = () => {
    // Clear any selected entity
    setSelectedLocation(null);
    setSelectedDepartment(null);
    setSelectedPosition(null);
    setSelectedEmployee(null);
    setIsDialogOpen(true);
  };

  // Handle editing entity
  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setIsDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setIsDialogOpen(true);
  };

  const handleEditPosition = (position: JobPosition) => {
    setSelectedPosition(position);
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  // Handle form success
  const handleSuccess = () => {
    setIsDialogOpen(false);
    setSelectedLocation(null);
    setSelectedDepartment(null);
    setSelectedPosition(null);
    setSelectedEmployee(null);
    setRefreshKey((prev) => prev + 1); // Trigger refresh
  };

  // Handle form cancel
  const handleCancel = () => {
    setIsDialogOpen(false);
    setSelectedLocation(null);
    setSelectedDepartment(null);
    setSelectedPosition(null);
    setSelectedEmployee(null);
  };

  // Get dialog title based on active tab and selection
  const getDialogTitle = () => {
    const isEditing =
      selectedLocation || selectedDepartment || selectedPosition || selectedEmployee;

    const prefix = isEditing ? 'Edit' : 'Create';

    switch (activeTab) {
      case 'employee':
        return `${prefix} Employee`;
      case 'position':
        return `${prefix} Job Position`;
      case 'department':
        return `${prefix} Department`;
      case 'location':
        return `${prefix} Location`;
      default:
        return 'Form';
    }
  };

  // Get create button text
  const getCreateButtonText = () => {
    switch (activeTab) {
      case 'employee':
        return 'New Employee';
      case 'position':
        return 'New Position';
      case 'department':
        return 'New Department';
      case 'location':
        return 'New Location';
      default:
        return 'Create New';
    }
  };

  return (
    <ViewContainer
      title="Administration"
      subtitle="Manage company locations, departments, positions, and employees"
      headerActions={
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          {getCreateButtonText()}
        </Button>
      }
    >
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EntityType)}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="employee" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Employees</span>
            </TabsTrigger>
            <TabsTrigger value="position" className="gap-2">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">Positions</span>
            </TabsTrigger>
            <TabsTrigger value="department" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Departments</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="gap-2">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Locations</span>
            </TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employee" className="space-y-4">
            <EmployeeList
              key={`employee-${refreshKey}`}
              showInactive={false}
              onEmployeeSelect={handleEditEmployee}
            />
          </TabsContent>

          {/* Job Positions Tab */}
          <TabsContent value="position" className="space-y-4">
            <JobPositionList
              key={`position-${refreshKey}`}
              showInactive={false}
              onPositionSelect={handleEditPosition}
            />
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="department" className="space-y-4">
            <DepartmentList
              key={`department-${refreshKey}`}
              showInactive={false}
              onDepartmentSelect={handleEditDepartment}
            />
          </TabsContent>

          {/* Locations Tab */}
          <TabsContent value="location" className="space-y-4">
            <LocationList
              key={`location-${refreshKey}`}
              showInactive={false}
              onLocationSelect={handleEditLocation}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {activeTab === 'employee' && (
              <EmployeeForm
                employee={selectedEmployee}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}

            {activeTab === 'position' && (
              <JobPositionForm
                jobPosition={selectedPosition}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}

            {activeTab === 'department' && (
              <DepartmentForm
                department={selectedDepartment}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}

            {activeTab === 'location' && (
              <LocationForm
                location={selectedLocation}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ViewContainer>
  );
}
