import React from 'react';

interface PageContainerProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  children,
  className = ''
}) => {
  return (
    <div className={`p-6 ${className}`}>
      {title && (
        <h1 className="text-2xl font-bold mb-6">{title}</h1>
      )}
      {children}
    </div>
  );
};
