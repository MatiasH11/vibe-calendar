/**
 * Progress Indicator Component
 * Shows loading progress with customizable styles and messages
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export interface ProgressIndicatorProps {
  progress?: number;
  message?: string;
  status?: 'loading' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  className?: string;
}

export function ProgressIndicator({
  progress,
  message,
  status = 'loading',
  size = 'md',
  showPercentage = true,
  className,
}: ProgressIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className={cn('text-green-500', iconSizes[size])} />;
      case 'error':
        return <XCircle className={cn('text-red-500', iconSizes[size])} />;
      case 'warning':
        return <AlertCircle className={cn('text-yellow-500', iconSizes[size])} />;
      default:
        return <Loader2 className={cn('animate-spin text-blue-500', iconSizes[size])} />;
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Status and Message */}
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        {message && (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {message}
          </span>
        )}
        {showPercentage && progress !== undefined && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {Math.round(progress)}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {progress !== undefined && (
        <div className={cn(
          'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
          sizeClasses[size]
        )}>
          <div
            className={cn(
              'h-full transition-all duration-300 ease-out rounded-full',
              getProgressColor()
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Circular Progress Indicator
 */
export interface CircularProgressProps {
  progress?: number;
  size?: number;
  strokeWidth?: number;
  status?: 'loading' | 'success' | 'error' | 'warning';
  showPercentage?: boolean;
  className?: string;
}

export function CircularProgress({
  progress = 0,
  size = 40,
  strokeWidth = 4,
  status = 'loading',
  showPercentage = true,
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getStrokeColor = () => {
    switch (status) {
      case 'success':
        return 'stroke-green-500';
      case 'error':
        return 'stroke-red-500';
      case 'warning':
        return 'stroke-yellow-500';
      default:
        return 'stroke-blue-500';
    }
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('transition-all duration-300 ease-out', getStrokeColor())}
        />
      </svg>
      {showPercentage && (
        <span className="absolute text-xs font-medium text-gray-700 dark:text-gray-300">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}

/**
 * Step Progress Indicator
 */
export interface StepProgressProps {
  steps: Array<{
    label: string;
    status: 'pending' | 'current' | 'completed' | 'error';
  }>;
  className?: string;
}

export function StepProgress({ steps, className }: StepProgressProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-3">
          {/* Step indicator */}
          <div className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
            {
              'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400': step.status === 'pending',
              'bg-blue-500 text-white': step.status === 'current',
              'bg-green-500 text-white': step.status === 'completed',
              'bg-red-500 text-white': step.status === 'error',
            }
          )}>
            {step.status === 'completed' ? (
              <CheckCircle className="h-4 w-4" />
            ) : step.status === 'error' ? (
              <XCircle className="h-4 w-4" />
            ) : step.status === 'current' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              index + 1
            )}
          </div>

          {/* Step label */}
          <span className={cn(
            'text-sm',
            {
              'text-gray-500 dark:text-gray-400': step.status === 'pending',
              'text-blue-600 dark:text-blue-400 font-medium': step.status === 'current',
              'text-green-600 dark:text-green-400': step.status === 'completed',
              'text-red-600 dark:text-red-400': step.status === 'error',
            }
          )}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}