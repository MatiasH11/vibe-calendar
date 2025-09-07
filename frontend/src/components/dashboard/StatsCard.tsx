'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  trend = 'neutral',
  icon: Icon, 
  color = "text-blue-600",
  bgColor = "bg-blue-50",
  className 
}: StatsCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1 min-w-0 flex-1">
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm font-medium text-gray-600 truncate"
              >
                {title}
              </motion.p>
              <motion.p 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-xl sm:text-2xl font-bold text-gray-900"
              >
                {value}
              </motion.p>
              {change && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={cn("text-xs sm:text-sm", trendColors[trend])}
                >
                  {change}
                </motion.p>
              )}
            </div>
            <motion.div 
              initial={{ opacity: 0, rotate: -180 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={cn("p-2 sm:p-3 rounded-lg flex-shrink-0", bgColor)}
            >
              <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", color)} />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
