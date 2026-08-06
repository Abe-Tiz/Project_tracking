import React from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Todo', label: 'Todo' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Review', label: 'Review' },
  { value: 'Done', label: 'Done' }
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priority' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' }
];

export const TaskFilters = React.memo(({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterPriority,
  onFilterPriorityChange,
  filterMember,
  onFilterMemberChange,
  members
}) => {
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-white rounded-xl border border-[#E7E5E0]">
      <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
        <FiSearch className="text-[#8A8985]" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search tasks..."
          className="flex-1 bg-transparent border-none outline-none text-sm pj-body"
        />
      </div>
      
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        <FiFilter className="text-[#8A8985]" size={14} />
        
        <select
          value={filterStatus}
          onChange={onFilterStatusChange}
          className="px-2 py-1 text-sm border border-[#E7E5E0] rounded-lg bg-white focus:border-[#3E3AA0] focus:ring-1 focus:ring-[#3E3AA0] outline-none pj-body"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        <select
          value={filterPriority}
          onChange={onFilterPriorityChange}
          className="px-2 py-1 text-sm border border-[#E7E5E0] rounded-lg bg-white focus:border-[#3E3AA0] focus:ring-1 focus:ring-[#3E3AA0] outline-none pj-body"
        >
          {PRIORITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        
        {members?.length > 0 && (
          <select
            value={filterMember}
            onChange={onFilterMemberChange}
            className="px-2 py-1 text-sm border border-[#E7E5E0] rounded-lg bg-white focus:border-[#3E3AA0] focus:ring-1 focus:ring-[#3E3AA0] outline-none pj-body"
          >
            <option value="all">All Members</option>
            {members.map(member => (
              <option key={member._id} value={member._id}>{member.name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
});