import React from 'react';

const BUTTON_VARIANTS = {
  primary: 'bg-[#3E3AA0] hover:bg-[#33308A] text-white',
  secondary: 'bg-[#F2F1ED] hover:bg-[#E7E5E0] text-[#5B5A56]',
  success: 'bg-[#12786B] hover:bg-[#0F5F54] text-white',
  danger: 'bg-[#B23A48] hover:bg-[#8A1F2A] text-white',
  warning: 'bg-[#FBECD9] hover:bg-[#F5DDBF] text-[#C1741F]',
};

export const Button = React.memo(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  icon: Icon,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-2.5 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Loading...
        </>
      ) : (
        <>
          {Icon && <Icon className="mr-2" size={16} />}
          {children}
        </>
      )}
    </button>
  );
});