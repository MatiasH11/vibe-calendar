'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  className?: string;
  children: React.ReactNode;
}

interface AvatarFallbackProps {
  className?: string;
  children: React.ReactNode;
}

export function Avatar({ className, children }: AvatarProps) {
  return (
    <div className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}>
      {children}
    </div>
  );
}

export function AvatarFallback({ className, children }: AvatarFallbackProps) {
  return (
    <div className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium text-sm",
      className
    )}>
      {children}
    </div>
  );
}