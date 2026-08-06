import React from 'react';

const AVATAR_PALETTE = ['#3E3AA0', '#12786B', '#B23A48', '#C1741F', '#6B4E9C', '#2E6B8F'];

const getAvatarColor = (name = '') => {
  // Use a default color for unknown names
  if (!name || name === 'Unknown' || name === 'undefined' || name === 'null' || name === '?') {
    return '#8A8985'; // Gray for unknown
  }
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};

const getInitials = (name = '') => {
  if (!name || name === 'Unknown' || name === 'undefined' || name === 'null' || name === '?') {
    return '?';
  }
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const Avatar = React.memo(({ name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
});

Avatar.displayName = 'Avatar';