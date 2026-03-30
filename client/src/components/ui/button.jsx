import React from 'react';

const buttonVariants = ({ variant = 'default', size = 'md', className = '' }) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
    outline: 'border border-border hover:bg-muted focus:ring-gray-300',
    ghost: 'hover:bg-muted focus:ring-gray-300',
    hero: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    google: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return `${baseStyles} ${variants[variant] || variants.default} ${sizes[size]} ${className}`.trim();
};

export const Button = React.forwardRef(({ className = '', variant = 'default', size = 'md', asChild, ...props }, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary',
    outline: 'border border-border hover:bg-muted focus:ring-gray-300',
    ghost: 'hover:bg-muted focus:ring-gray-300',
    hero: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    // Add Google variant
    google: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500 shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const buttonClassName = `${baseStyles} ${variants[variant] || variants.default} ${sizes[size]} ${className}`;

  // If asChild is true, render the child element with button styles
  if (asChild && React.isValidElement(props.children)) {
    const child = React.Children.only(props.children);
    return React.cloneElement(child, {
      ref,
      className: `${buttonClassName} ${child.props.className || ''}`.trim(),
      ...props,
      children: child.props.children,
    });
  }

  return (
    <button
      ref={ref}
      className={buttonClassName}
      {...props}
    />
  );
});

Button.displayName = 'Button';

export { buttonVariants };