import React from 'react';

const Switch = React.forwardRef(({ className = '', checked, defaultChecked, onCheckedChange, ...props }, ref) => {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false);
  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newChecked = !currentChecked;

    if (!isControlled) {
      setInternalChecked(newChecked);
    }

    if (onCheckedChange) {
      onCheckedChange(newChecked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      ref={ref}
      aria-checked={currentChecked}
      onClick={handleClick}
      className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 disabled:cursor-not-allowed disabled:opacity-50 ${
        currentChecked ? 'bg-orange-500' : 'bg-slate-600'
      } ${className}`}
      data-state={currentChecked ? 'checked' : 'unchecked'}
      {...props}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ${
          currentChecked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
});

Switch.displayName = 'Switch';

export { Switch };
