import React from 'react';
import { FiX } from 'react-icons/fi';

const AVAILABLE_LABELS = [
  { name: 'Bug', color: '#B23A48' },
  { name: 'Feature', color: '#3E3AA0' },
  { name: 'Enhancement', color: '#12786B' },
  { name: 'Documentation', color: '#C1741F' },
  { name: 'Design', color: '#6B4E9C' },
  { name: 'Testing', color: '#2E6B8F' },
  { name: 'UI/UX', color: '#B23A48' },
  { name: 'Backend', color: '#3E3AA0' },
  { name: 'Frontend', color: '#12786B' },
  { name: 'API', color: '#6B4E9C' },
  { name: 'Database', color: '#2E6B8F' },
  { name: 'DevOps', color: '#C1741F' },
  { name: 'Security', color: '#B23A48' }
];

export const LabelList = React.memo(({ labels, onRemove, className = '' }) => {
  const safeLabels = Array.isArray(labels) ? labels : [];
  if (safeLabels.length === 0) return null;

  const getLabelColor = (label) => {
    const found = AVAILABLE_LABELS.find(l => l.name === label);
    return found?.color || '#8A8985';
  };

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {safeLabels.map((label, idx) => {
        const labelName = typeof label === 'string' ? label : label?.name || '';
        const labelColor = typeof label === 'string' ? getLabelColor(label) : label?.color || '#8A8985';
        
        if (!labelName || labelName === 'null') return null;
        
        return (
          <span
            key={`label-${idx}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full"
            style={{ backgroundColor: labelColor + '20', color: labelColor }}
          >
            {labelName}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(labelName)}
                className="ml-1 hover:opacity-70"
              >
                <FiX size={12} />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
});