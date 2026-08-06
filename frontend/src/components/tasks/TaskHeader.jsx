// import React from 'react';
// import { FiArrowLeft, FiUsers, FiRefreshCw, FiPlus, FiGrid, FiList } from 'react-icons/fi';
// import { StatusBadge } from '../common/StatusBadge';
// import { Button } from '../ui/Button';
// import { MemberManagement } from './MemberManagement';

// export const TaskHeader = React.memo(({
//   project,
//   members,
//   tasks,
//   progress,
//   viewMode,
//   setViewMode,
//   onRefresh,
//   refreshing,
//   onAddTask,
//   onBack,
//   onMembersUpdate 
// }) => {
//   return (
//     <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//       <div>
//         <button
//           onClick={onBack}
//           className="text-sm text-[#8A8985] hover:text-[#5B5A56] flex items-center gap-1 transition-colors pj-body"
//         >
//           <FiArrowLeft className="mr-1" /> Back to Projects
//         </button>
        
//         <div className="flex items-center gap-3 mt-2 flex-wrap">
//           <h1 className="pj-display text-2xl font-semibold text-[#1B1B1E]">
//             {project?.name || 'Project'}
//           </h1>
//           {project?.status && (
//             <StatusBadge status={project.status} />
//           )}
//           {members?.length > 0 && (
//             <span className="text-sm text-[#8A8985] pj-mono flex items-center gap-1">
//               <FiUsers size={14} />
//               {members.length} member{members.length !== 1 ? 's' : ''}
//             </span>
//           )}
//         </div>
        
//         {project?.description && (
//           <p className="text-sm text-[#5B5A56] mt-1 pj-body">{project.description}</p>
//         )}
        
//         <div className="flex items-center gap-4 mt-2">
//           <div className="flex items-center gap-2">
//             <div className="w-24">
//               <div className="flex justify-between text-xs text-[#8A8985] mb-1 pj-body">
//                 <span>Progress</span>
//                 <span className="font-medium pj-mono" style={{ 
//                   color: progress >= 80 ? '#12786B' : progress >= 50 ? '#C1741F' : '#B23A48' 
//                 }}>
//                   {Math.round(progress)}%
//                 </span>
//               </div>
//               <div className="w-full bg-[#EEEEEC] rounded-full h-1.5">
//                 <div
//                   className="h-1.5 rounded-full transition-all duration-500"
//                   style={{ 
//                     width: `${Math.min(progress, 100)}%`,
//                     backgroundColor: progress >= 80 ? '#12786B' : progress >= 50 ? '#C1741F' : '#B23A48'
//                   }}
//                 />
//               </div>
//             </div>
//           </div>
//           <span className="text-sm text-[#8A8985] pj-mono">
//             {tasks.length} tasks • {tasks.filter(t => t.status === 'Done').length} completed
//           </span>
//           <button
//             onClick={onRefresh}
//             disabled={refreshing}
//             className="p-2 text-[#8A8985] hover:text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
//             title="Refresh"
//           >
//             <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
//           </button>
//         </div>
//       </div>
      
//       <div className="flex items-center gap-2 flex-wrap">
//         <div className="flex items-center bg-[#F2F1ED] rounded-xl p-1">
//           <button
//             onClick={() => setViewMode('board')}
//             className={`p-2 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-white text-[#3E3AA0] shadow-sm' : 'text-[#8A8985] hover:text-[#5B5A56]'}`}
//             title="Board View"
//           >
//             <FiGrid size={16} />
//           </button>
//           <button
//             onClick={() => setViewMode('list')}
//             className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-[#3E3AA0] shadow-sm' : 'text-[#8A8985] hover:text-[#5B5A56]'}`}
//             title="List View"
//           >
//             <FiList size={16} />
//           </button>
//         </div>


//          {/* Add Member Management Button */}
//         {project && (
//           <MemberManagement
//             projectId={project._id}
//             members={members}
//             onMembersUpdate={onMembersUpdate}
//           />
//         )}


        
//         <Button onClick={onAddTask} icon={FiPlus}>
//           Add Task
//         </Button>
//       </div>
//     </div>
//   );
// });









// src/components/tasks/TaskHeader.jsx
import React from 'react';
import { FiArrowLeft, FiRefreshCw, FiPlus, FiGrid, FiList } from 'react-icons/fi';
import { StatusBadge } from '../common/StatusBadge';
import { Button } from '../ui/Button';
import { MemberManagement } from './MemberManagement';

export const TaskHeader = React.memo(({
  project,
  members,
  tasks,
  progress,
  viewMode,
  setViewMode,
  onRefresh,
  refreshing,
  onAddTask,
  onBack,
  onMembersUpdate
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <button
          onClick={onBack}
          className="text-sm text-[#8A8985] hover:text-[#5B5A56] flex items-center gap-1 transition-colors pj-body"
        >
          <FiArrowLeft className="mr-1" /> Back to Projects
        </button>
        
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <h1 className="pj-display text-2xl font-semibold text-[#1B1B1E]">
            {project?.name || 'Project'}
          </h1>
          {project?.status && (
            <StatusBadge status={project.status} />
          )}
        </div>
        
        {project?.description && (
          <p className="text-sm text-[#5B5A56] mt-1 pj-body">{project.description}</p>
        )}
        
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-24">
              <div className="flex justify-between text-xs text-[#8A8985] mb-1 pj-body">
                <span>Progress</span>
                <span className="font-medium pj-mono" style={{ 
                  color: progress >= 80 ? '#12786B' : progress >= 50 ? '#C1741F' : '#B23A48' 
                }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-[#EEEEEC] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: progress >= 80 ? '#12786B' : progress >= 50 ? '#C1741F' : '#B23A48'
                  }}
                />
              </div>
            </div>
          </div>
          <span className="text-sm text-[#8A8985] pj-mono">
            {tasks.length} tasks • {tasks.filter(t => t.status === 'Done').length} completed
          </span>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-2 text-[#8A8985] hover:text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
            title="Refresh"
          >
            <FiRefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-[#F2F1ED] rounded-xl p-1">
          <button
            onClick={() => setViewMode('board')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'board' ? 'bg-white text-[#3E3AA0] shadow-sm' : 'text-[#8A8985] hover:text-[#5B5A56]'}`}
            title="Board View"
          >
            <FiGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-[#3E3AA0] shadow-sm' : 'text-[#8A8985] hover:text-[#5B5A56]'}`}
            title="List View"
          >
            <FiList size={16} />
          </button>
        </div>
        
        {/* Member Management */}
        {project && (
          <MemberManagement
            projectId={project._id}
            members={members}
            onMembersUpdate={onMembersUpdate}
            isProjectOwner={true}
          />
        )}
        
        <Button onClick={onAddTask} icon={FiPlus}>
          Add Task
        </Button>
      </div>
    </div>
  );
});