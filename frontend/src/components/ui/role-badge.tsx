'use client';

import { Badge } from '@/components/ui/badge';
import { ROLE_COLORS, ROLE_ICONS } from '@/lib/constants';
import { BusinessRole } from '@/types/auth';

interface RoleBadgeProps {
  role: BusinessRole;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const colorClass = ROLE_COLORS[role] || ROLE_COLORS.default;
  const icon = ROLE_ICONS[role] || ROLE_ICONS.default;

  return (
    <Badge 
      variant="outline" 
      className={`${colorClass} text-white border-0 ${className}`}
    >
      <span className="mr-1">{icon}</span>
      {role}
    </Badge>
  );
}
