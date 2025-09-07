'use client';

import { Badge } from '@/components/ui/badge';
import { USER_TYPE_COLORS, USER_TYPE_ICONS } from '@/lib/constants';
import { UserType } from '@/types/auth';

interface PermissionBadgeProps {
  userType: UserType;
  className?: string;
}

export function PermissionBadge({ userType, className }: PermissionBadgeProps) {
  const colorClass = USER_TYPE_COLORS[userType];
  const icon = USER_TYPE_ICONS[userType];
  const label = userType === 'admin' ? 'Administrador' : 'Empleado';

  return (
    <Badge 
      variant="secondary" 
      className={`${colorClass} text-white ${className}`}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </Badge>
  );
}
