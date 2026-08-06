import React from 'react';
import { FiX } from 'react-icons/fi';

export const Modal = React.memo(({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-2xl',
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className={`relative bg-white rounded-2xl shadow-2xl ${maxWidth} w-full mx-4 p-6 max-h-[90vh] overflow-y-auto ${className}`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8A8985] hover:text-[#1B1B1E] transition-colors z-10"
        >
          <FiX size={22} />
        </button>
        
        {title && (
          <h3 className="pj-display text-xl font-semibold text-[#1B1B1E] mb-1">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-[#8A8985] mb-4 pj-body">{subtitle}</p>
        )}
        
        {children}
      </div>
    </div>
  );
});