export const PROJECT_STATUSES = ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'];
export const PROJECT_PRIORITIES = ['High', 'Medium', 'Low'];
export const PROJECT_CATEGORIES = ['Software', 'Marketing', 'Research', 'Design', 'Other'];

export const TASK_STATUSES = ['Todo', 'In Progress', 'Review', 'Completed', 'Blocked', 'Cancelled'];
export const TASK_PRIORITIES = ['Highest', 'High', 'Medium', 'Low', 'Lowest'];
export const TASK_TYPES = ['Feature', 'Bug', 'Improvement', 'Design', 'Testing', 'Review'];

export const MEETING_TYPES = ['Planning', 'Review', 'Retrospective', 'Stakeholder', 'Standup', 'Workshop', 'Ad-hoc'];

export const ROLES = ['Admin', 'Project Manager', 'Team Member', 'Viewer'];

export const getStatusColor = (status, type = 'task') => {
  const colors = {
    'Planning': 'bg-blue-100 text-blue-800',
    'Active': 'bg-green-100 text-green-800',
    'On Hold': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-purple-100 text-purple-800',
    'Archived': 'bg-gray-100 text-gray-800',
    'Todo': 'bg-gray-100 text-gray-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Review': 'bg-yellow-100 text-yellow-800',
    'Blocked': 'bg-red-100 text-red-800',
    'Cancelled': 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority) => {
  const colors = {
    'Highest': 'bg-red-100 text-red-800',
    'High': 'bg-red-100 text-red-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800',
    'Lowest': 'bg-gray-100 text-gray-800',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};