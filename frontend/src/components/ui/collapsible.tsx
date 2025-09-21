"use client"

import * as React from "react"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface CollapsibleTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  onClick?: () => void
}

interface CollapsibleContentProps {
  children: React.ReactNode
}

const Collapsible: React.FC<CollapsibleProps> = ({ open, onOpenChange, children }) => {
  return (
    <div data-state={open ? "open" : "closed"}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            ...child.props, 
            open, 
            onOpenChange 
          } as any);
        }
        return child;
      })}
    </div>
  )
}

const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({ 
  asChild, 
  children, 
  onClick,
  ...props 
}) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onClick: (e: React.MouseEvent) => {
        children.props.onClick?.(e);
        onClick?.();
      }
    });
  }
  
  return (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
}

const CollapsibleContent: React.FC<CollapsibleContentProps & { open?: boolean }> = ({ 
  children, 
  open 
}) => {
  if (!open) return null;
  return <div>{children}</div>;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }