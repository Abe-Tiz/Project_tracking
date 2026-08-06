import React from 'react';

export const LoadingSpinner = React.memo(({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-[#3E3AA0] ${sizeClasses[size]} ${className}`} />
  );
});