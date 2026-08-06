import React from 'react';
import { FiX } from 'react-icons/fi';

export const SubtaskList = React.memo(({ subtasks, onToggle, onRemove, className = '' }) => {
  const safeSubtasks = Array.isArray(subtasks) ? subtasks : [];
  if (safeSubtasks.length === 0) return null;

  const completed = safeSubtasks.filter(s => s?.completed).length;

  return (
    <div className={className}>
      <div className="space-y-1">
        {safeSubtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={subtask.completed || false}
              onChange={() => onToggle?.(subtask.id)}
              className="rounded border-[#E7E5E0] text-[#3E3AA0] focus:ring-[#3E3AA0]"
            />
            <span className={`text-sm ${subtask.completed ? 'line-through text-[#8A8985]' : 'text-[#1B1B1E]'}`}>
              {subtask.title}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(subtask.id)}
                className="ml-auto text-[#8A8985] hover:text-[#B23A48]"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-[#8A8985] pj-mono">
        <span>Subtasks: {completed}/{safeSubtasks.length}</span>
        <div className="flex-1 h-1 bg-[#EEEEEC] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#3E3AA0] rounded-full transition-all duration-300"
            style={{ width: `${(completed / safeSubtasks.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
});