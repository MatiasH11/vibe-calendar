'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PermissionBadge } from './permission-badge';
import { RoleBadge } from './role-badge';
import { useUserContext } from '@/hooks/useUserContext';
import { usePermissions } from '@/hooks/usePermissions';

export function UserInfoCard() {
  const { employeeData, getUserFullName, getUserRoleDisplay } = useUserContext();
  const { businessRole } = usePermissions();

  if (!employeeData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Cargando información del usuario...
          </div>
        </CardContent>
      </Card>
    );
  }

  const initials = `${employeeData.user.first_name[0]}${employeeData.user.last_name[0]}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-500 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{getUserFullName()}</h3>
            <p className="text-sm text-gray-500">{employeeData.user.email}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <PermissionBadge userType="employee" />
          {businessRole && <RoleBadge role={businessRole} />}
        </div>
        <div className="text-sm text-gray-600">
          <p><strong>Posición:</strong> {employeeData.position}</p>
          <p><strong>Rol de Negocio:</strong> {employeeData.role.name}</p>
          <p><strong>Empresa:</strong> ID {employeeData.company_id}</p>
        </div>
      </CardContent>
    </Card>
  );
}
