import React from 'react';
import { FiEdit2, FiUser, FiChevronRight, FiTrash2, FiCalendar, FiClock, FiMessageCircle, FiCheckCircle, FiX } from 'react-icons/fi';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { LabelList } from '../common/LabelList';
import { LinkList } from '../common/LinkList';
import { AttachmentList } from '../common/AttachmentList';

const STATUS_COLORS = {
  'Todo': '#8A8985',
  'In Progress': '#3E3AA0',
  'Review': '#C1741F',
  'Done': '#12786B'
};

const NEXT_STATUS = {
  'Todo': 'In Progress',
  'In Progress': 'Review',
  'Review': 'Done',
  'Done': null
};

export const TaskListItem = React.memo(({
  task,
  members,
  onEdit,
  onDelete,
  onStatusChange,
  onAssign,
  onImagePreview
}) => {
  const assignedMember = members?.find(m => m?._id === task.assigned_to);
  const displayName = assignedMember?.name || task.assigned_to_name || 'Unassigned';
  const nextStatus = NEXT_STATUS[task.status];

  return (
    <div className="bg-white border border-[#E7E5E0] rounded-xl hover:border-[#3E3AA0]/30 hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="flex">
        <div className="w-1 flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[task.status] || '#8A8985' }} />
        <div className="p-4 flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="pj-display font-semibold text-[#1B1B1E] text-sm hover:text-[#3E3AA0] transition-colors">
                  {task.title}
                </h4>
                <StatusBadge status={task.status} showDot={false} />
                <PriorityBadge priority={task.priority} />
              </div>
              
              {task.description && (
                <p className="text-sm text-[#5B5A56] line-clamp-1 mt-1 pj-body">
                  {task.description}
                </p>
              )}
              
              <LabelList labels={task.labels} />
              
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <AttachmentList 
                  attachments={task.attachments} 
                  onPreview={onImagePreview}
                  className="!mt-0"
                />
                <LinkList links={task.links} />
              </div>
              
              <div className="mt-2 flex items-center gap-4 text-xs text-[#8A8985] flex-wrap">
                {task.due_date && (
                  <span className="flex items-center gap-1 pj-mono">
                    <FiCalendar size={12} />
                    {new Date(task.due_date).toLocaleDateString()}
                  </span>
                )}
                {task.assigned_to && (
                  <span className="flex items-center gap-1">
                    <Avatar name={displayName} size="sm" />
                    <span className="pj-body">{displayName}</span>
                  </span>
                )}
                {task.estimated_hours > 0 && (
                  <span className="flex items-center gap-1 pj-mono">
                    <FiClock size={12} />
                    {task.estimated_hours}h
                  </span>
                )}
                {task.comments && task.comments.length > 0 && (
                  <span className="flex items-center gap-1 pj-mono">
                    <FiMessageCircle size={12} />
                    {task.comments.length}
                  </span>
                )}
                {task.subtasks && task.subtasks.length > 0 && (
                  <span className="flex items-center gap-1 pj-mono">
                    <FiCheckCircle size={12} />
                    {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onEdit(task)}
                className="p-1.5 text-[#8A8985] hover:text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
                title="Edit Task"
              >
                <FiEdit2 size={16} />
              </button>
              
            {members.map(member => (
            <button
                key={member._id}
                onClick={() => {
                onAssign(task._id, member._id);
                const dropdown = document.querySelector(`[data-task="${task._id}"]`);
                dropdown?.classList.add('hidden');
                }}
                className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#EDEBFB] flex items-center gap-2"
            >
                <Avatar name={member.name || 'Unknown'} size="sm" />
                <span className="pj-body">{member.name || 'Unassigned'}</span>
                {task.assigned_to === member._id && (
                <FiCheckCircle size={12} className="text-[#12786B] ml-auto" />
                )}
            </button>
            ))}
              
              {nextStatus && (
                <button
                  onClick={() => onStatusChange(task._id, nextStatus)}
                  className="p-1.5 text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
                  title={`Move to ${nextStatus}`}
                >
                  <FiChevronRight size={16} />
                </button>
              )}
              <button
                onClick={() => onDelete(task._id)}
                className="p-1.5 text-[#B23A48] hover:bg-[#F7E6E8] rounded-lg transition-colors"
                title="Delete Task"
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});