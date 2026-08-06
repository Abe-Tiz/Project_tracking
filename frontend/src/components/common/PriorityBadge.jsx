import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';

const PRIORITY_STYLES = {
  'High': { text: '#B23A48', bg: '#F7E6E8', icon: FiArrowUp },
  'Medium': { text: '#C1741F', bg: '#FBECD9', icon: FiArrowUp },
  'Low': { text: '#12786B', bg: '#E4F2EE', icon: FiArrowDown }
};

export const PriorityBadge = React.memo(({ priority, className = '' }) => {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES['Medium'];
  const Icon = style.icon;
  
  return (
    <span
      className={`px-2 py-0.5 text-[10px] uppercase tracking-wide rounded-full inline-flex items-center gap-1 ${className}`}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      <Icon size={12} />
      {priority}
    </span>
  );
});