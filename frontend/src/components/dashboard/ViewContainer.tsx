'use client';

import { motion } from 'framer-motion';
import { DashboardHeader } from './DashboardHeader';
import { cn } from '@/lib/utils';

interface ViewContainerProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
  showHeader?: boolean;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const contentVariants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export function ViewContainer({ 
  title, 
  subtitle, 
  children, 
  headerActions,
  className,
  showHeader = true 
}: ViewContainerProps) {
  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full flex flex-col"
    >
      {showHeader && (
        <DashboardHeader title={title} subtitle={subtitle}>
          {headerActions}
        </DashboardHeader>
      )}
      
      <motion.div 
        variants={contentVariants}
        className={cn("flex-1 overflow-y-auto", className)}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
