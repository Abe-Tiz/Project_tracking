import React from 'react';
import { FiEdit2, FiUser, FiChevronRight, FiTrash2, FiCalendar, FiClock, FiPaperclip, FiMessageCircle, FiX, FiCheckCircle } from 'react-icons/fi';
import { Avatar } from '../common/Avatar';
import { StatusBadge } from '../common/StatusBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { LabelList } from '../common/LabelList';
import { LinkList } from '../common/LinkList';
import { SubtaskList } from '../common/SubtaskList';
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

export const TaskCard = React.memo(({
  task,
  members,
  onEdit,
  onDelete,
  onStatusChange,
  onAssign,
  onImagePreview,
}) => {
  const assignedMember = members?.find(m => m?._id === task.assigned_to);
  const displayName = assignedMember?.name && assignedMember.name !== 'Unknown' 
  ? assignedMember.name 
  : task.assigned_to_name && task.assigned_to_name !== 'Unknown'
    ? task.assigned_to_name
    : 'Unassigned';
  const nextStatus = NEXT_STATUS[task.status];

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-[#E7E5E0] group">
      <div className="h-[3px] w-full" style={{ backgroundColor: STATUS_COLORS[task.status] || '#8A8985' }} />
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} showDot={false} />
            </div>
            
            <h4 className="pj-display font-semibold text-[#1B1B1E] text-sm hover:text-[#3E3AA0] transition-colors">
              {task.title}
            </h4>
            
            {task.description && (
              <p className="text-xs text-[#8A8985] mt-1 line-clamp-2 pj-body">
                {task.description}
              </p>
            )}
            
            <LabelList labels={task.labels} />
            <SubtaskList subtasks={task.subtasks} />
            <AttachmentList 
              attachments={task.attachments} 
              onPreview={onImagePreview}
            />
            <LinkList links={task.links} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#EFEDE8]">
          <div className="flex items-center gap-3 text-xs text-[#8A8985] flex-wrap">
            {task.due_date && (
              <span className="flex items-center gap-1 pj-mono">
                <FiCalendar size={12} />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {task.assigned_to && (
              <span className="flex items-center gap-1">
                <Avatar name={displayName} size="sm" />
                <span className="pj-body text-[#5B5A56]">
                  {displayName?.split(' ')[0] || 'Assigned'}
                </span>
              </span>
            )}
            {task.estimated_hours > 0 && (
              <span className="flex items-center gap-1 pj-mono">
                <FiClock size={12} />
                {task.estimated_hours}h
              </span>
            )}
            {(task.attachments?.length > 0 || task.links?.length > 0) && (
              <span className="flex items-center gap-1 text-[#8A8985]">
                <FiPaperclip size={10} />
                {((task.attachments?.length || 0) + (task.links?.length || 0))}
              </span>
            )}
            {task.comments?.length > 0 && (
              <span className="flex items-center gap-1">
                <FiMessageCircle size={12} />
                {task.comments.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-[#8A8985] hover:text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
              title="Edit Task"
            >
              <FiEdit2 size={14} />
            </button>
            
            {members?.length > 0 && (
              <div className="relative">
                <button
                  className="p-1.5 text-[#8A8985] hover:text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
                  title="Assign member"
                  onClick={(e) => {
                    const dropdown = e.currentTarget.nextElementSibling;
                    dropdown?.classList.toggle('hidden');
                  }}
                >
                  <FiUser size={14} />
                </button>
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-[#E7E5E0] hidden z-10 py-1">
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
                      <Avatar name={member.name} size="sm" />
                      <span className="pj-body">{member.name}</span>
                      {task.assigned_to === member._id && (
                        <FiCheckCircle size={12} className="text-[#12786B] ml-auto" />
                      )}
                    </button>
                  ))}
                  {task.assigned_to && (
                    <button
                      onClick={() => {
                        onAssign(task._id, null);
                        const dropdown = document.querySelector(`[data-task="${task._id}"]`);
                        dropdown?.classList.add('hidden');
                      }}
                      className="w-full px-3 py-1.5 text-left text-sm text-[#B23A48] hover:bg-[#F7E6E8] flex items-center gap-2 border-t border-[#E7E5E0] mt-1 pt-1"
                    >
                      <FiX size={12} />
                      <span>Unassign</span>
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {nextStatus && (
              <button
                onClick={() => onStatusChange(task._id, nextStatus)}
                className="p-1.5 text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
                title={`Move to ${nextStatus}`}
              >
                <FiChevronRight size={14} />
              </button>
            )}
            
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 text-[#B23A48] hover:bg-[#F7E6E8] rounded-lg transition-colors"
              title="Delete Task"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});