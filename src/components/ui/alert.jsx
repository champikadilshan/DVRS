// src/components/ui/alert.jsx
import React from 'react';

const Alert = ({ children, className = '', variant = 'default' }) => {
  const baseStyles = 'relative w-full rounded-lg border p-4 mb-4';
  const variants = {
    default: 'bg-background text-foreground',
    destructive: 'border-red-500 text-red-600 bg-red-50',
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      role="alert"
    >
      {children}
    </div>
  );
};

const AlertDescription = ({ children, className = '' }) => {
  return (
    <div className={`text-sm flex items-center gap-2 ${className}`}>
      {children}
    </div>
  );
};

export { Alert, AlertDescription };
