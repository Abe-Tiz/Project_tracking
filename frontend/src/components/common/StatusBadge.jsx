import React from 'react';

const STATUS_STYLES = {
  'Todo': { bg: '#F2F1ED', text: '#5B5A56', dot: '#8A8985' },
  'In Progress': { bg: '#EDEBFB', text: '#3E3AA0', dot: '#3E3AA0' },
  'Review': { bg: '#FBECD9', text: '#C1741F', dot: '#C1741F' },
  'Done': { bg: '#E4F2EE', text: '#12786B', dot: '#12786B' }
};

export const StatusBadge = React.memo(({ status, showDot = true, className = '' }) => {
  const style = STATUS_STYLES[status] || STATUS_STYLES['Todo'];
  
  return (
    <span
      className={`px-2 py-0.5 text-[10px] rounded-full inline-flex items-center gap-1 ${className}`}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {showDot && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: style.dot }} />}
      {status}
    </span>
  );
});