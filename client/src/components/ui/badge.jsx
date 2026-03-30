import React from 'react';

export const Badge = React.forwardRef(({ className = '', variant = 'default', ...props }, ref) => {
  const baseStyles = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium';

  const variants = {
    default: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    outline: 'border border-border text-foreground',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  };

  return (
    <div
      ref={ref}
      className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}
      {...props}
    />
  );
});

Badge.displayName = 'Badge';
