// api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor for logging and authentication
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 [${config.method?.toUpperCase()}] ${config.url}`);
    console.log('📤 Request Data:', config.data);
    console.log('📤 Request Params:', config.params);
    
    // Skip adding token for auth endpoints
    const isAuthEndpoint = config.url.includes('/auth/login') || 
                          config.url.includes('/auth/register') ||
                          config.url.includes('/auth/refresh');
    
    if (!isAuthEndpoint) {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Token attached to request');
      } else {
        console.warn('⚠️ No token found in localStorage');
      }
    } else {
      console.log('🔓 Auth endpoint - skipping token attachment');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.config.method?.toUpperCase()}] ${response.config.url}`);
    console.log('📥 Response Status:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle token expiration
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                            error.config?.url?.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        console.warn('⚠️ Token expired or invalid');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================
export const authAPI = {
  login: (email, password) => {
    console.log('📡 POST /auth/login');
    return api.post('/auth/login', { email, password });
  },
  
  register: (userData) => {
    console.log('📡 POST /auth/register');
    return api.post('/auth/register', userData);
  },
  
  logout: () => {
    console.log('📡 POST /auth/logout');
    return api.post('/auth/logout');
  },
  
  refresh: () => {
    console.log('📡 POST /auth/refresh');
    return api.post('/auth/refresh');
  },
  
  getProfile: () => {
    console.log('📡 GET /auth/profile');
    return api.get('/auth/profile');
  },
  
  updateProfile: (data) => {
    console.log('📡 PUT /auth/profile with data:', data);
    return api.put('/auth/profile', data);
  },
  
  changePassword: (data) => {
    console.log('📡 POST /auth/change-password with data:', data);
    return api.post('/auth/change-password', data);
  },
  
  deleteAccount: () => {
    console.log('📡 DELETE /auth/account');
    return api.delete('/auth/account');
  },
  
  verifyEmail: (token) => {
    console.log('📡 POST /auth/verify-email');
    return api.post('/auth/verify-email', { token });
  },
  
  forgotPassword: (email) => {
    console.log('📡 POST /auth/forgot-password');
    return api.post('/auth/forgot-password', { email });
  },
  
  resetPassword: (token, newPassword) => {
    console.log('📡 POST /auth/reset-password');
    return api.post('/auth/reset-password', { token, new_password: newPassword });
  },
  
  resendVerification: () => {
    console.log('📡 POST /auth/resend-verification');
    return api.post('/auth/resend-verification');
  },
  
  updatePreferences: (preferences) => {
    console.log('📡 PUT /auth/preferences with data:', preferences);
    return api.put('/auth/preferences', { preferences });
  },
  
  getUserStats: () => {
    console.log('📡 GET /auth/stats');
    return api.get('/auth/stats');
  },
  
  checkEmail: (email) => {
    console.log('📡 POST /auth/check-email');
    return api.post('/auth/check-email', { email });
  },
  
  updateNotifications: (settings) => {
    console.log('📡 PUT /auth/notifications with data:', settings);
    return api.put('/auth/notifications', settings);
  }
};

// ==================== PROJECT API ====================
export const projectAPI = {
  // ============ PROJECT CRUD ============
  
  // Get all projects with pagination and filters
  getAll: (page = 1, perPage = 20, status = null, search = null, priority = null) => {
    console.log('📊 Fetching projects with params:', { page, perPage, status, search, priority });
    let url = `/projects?page=${page}&per_page=${perPage}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (priority) url += `&priority=${encodeURIComponent(priority)}`;
    console.log(`📡 GET ${url}`);
    return api.get(url);
  },
  
  // Get project by ID
  getById: (id) => {
    console.log(`📡 GET /projects/${id}`);
    return api.get(`/projects/${id}`);
  },
  
  // Create a new project
  create: (data) => {
    console.log('📡 POST /projects with data:', data);
    return api.post('/projects', data);
  },
  
  // Update a project
  update: (id, data) => {
    console.log(`📡 PUT /projects/${id} with data:`, data);
    return api.put(`/projects/${id}`, data);
  },
  
  // Delete a project
  delete: (id) => {
    console.log(`📡 DELETE /projects/${id}`);
    return api.delete(`/projects/${id}`);
  },
  
  // Update project status
  updateStatus: (id, status) => {
    console.log(`📡 PATCH /projects/${id}/status with status:`, status);
    return api.patch(`/projects/${id}/status`, { status });
  },
  
  // Get project statistics
  getStats: (id) => {
    console.log(`📡 GET /projects/${id}/stats`);
    return api.get(`/projects/${id}/stats`);
  },
  
  // ============ MEMBER MANAGEMENT ============
  
  // Get all project members with details
  getMembers: (projectId) => {
    console.log(`📡 GET /projects/${projectId}/members`);
    return api.get(`/projects/${projectId}/members`);
  },
  
  // Add a member to project
  // Supports: { user_id: "..." } for existing users
  // Or: { name: "...", email: "...", ... } for external members
  addMember: (projectId, memberData) => {
    console.log(`📡 POST /projects/${projectId}/members with data:`, memberData);
    
    let requestData = memberData;
    
    // If memberData is a string, convert to object with user_id
    if (typeof memberData === 'string') {
      requestData = { user_id: memberData };
    }
    
    // If memberData is not an object, wrap it
    if (!requestData || typeof requestData !== 'object') {
      requestData = { user_id: memberData };
    }
    
    console.log(`📡 Sending request data:`, requestData);
    return api.post(`/projects/${projectId}/members`, requestData);
  },
  
  // Update a project member's details (for external members)
  updateMember: (projectId, memberId, data) => {
    console.log(`📡 PUT /projects/${projectId}/members/${memberId} with data:`, data);
    return api.put(`/projects/${projectId}/members/${memberId}`, data);
  },
  
  // Remove a member from project
  removeMember: (projectId, memberId) => {
    console.log(`📡 DELETE /projects/${projectId}/members/${memberId}`);
    return api.delete(`/projects/${projectId}/members/${memberId}`);
  },
  
  // Get member details by user ID
  getMemberDetails: async (userId) => {
    try {
      console.log(`📡 GET /users/${userId}`);
      const response = await api.get(`/users/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },
  
  // ============ PROJECT UTILITIES ============
  
  // Add a tag to project
  addTag: (projectId, tag) => {
    console.log(`📡 POST /projects/${projectId}/tags with tag:`, tag);
    return api.post(`/projects/${projectId}/tags`, { tag });
  },
  
  // Remove a tag from project
  removeTag: (projectId, tag) => {
    console.log(`📡 DELETE /projects/${projectId}/tags with tag:`, tag);
    return api.delete(`/projects/${projectId}/tags`, { data: { tag } });
  },
  
  // Add a link to project
  addLink: (projectId, linkData) => {
    console.log(`📡 POST /projects/${projectId}/links with data:`, linkData);
    return api.post(`/projects/${projectId}/links`, linkData);
  },
  
  // Remove a link from project
  removeLink: (projectId, linkId) => {
    console.log(`📡 DELETE /projects/${projectId}/links/${linkId}`);
    return api.delete(`/projects/${projectId}/links/${linkId}`);
  },
  
  // Upload an image to project
  uploadImage: (projectId, file) => {
    console.log(`📡 POST /projects/${projectId}/images`);
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/projects/${projectId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Remove an image from project
  removeImage: (projectId, imageId) => {
    console.log(`📡 DELETE /projects/${projectId}/images/${imageId}`);
    return api.delete(`/projects/${projectId}/images/${imageId}`);
  },
  
  // Upload a file to project
  uploadFile: (projectId, file) => {
    console.log(`📡 POST /projects/${projectId}/files`);
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/projects/${projectId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Remove a file from project
  removeFile: (projectId, fileId) => {
    console.log(`📡 DELETE /projects/${projectId}/files/${fileId}`);
    return api.delete(`/projects/${projectId}/files/${fileId}`);
  },
  
  // Get project activity log
  getActivity: (projectId, limit = 20) => {
    console.log(`📡 GET /projects/${projectId}/activity?limit=${limit}`);
    return api.get(`/projects/${projectId}/activity?limit=${limit}`);
  },
  
  // Archive a project
  archive: (projectId) => {
    console.log(`📡 POST /projects/${projectId}/archive`);
    return api.post(`/projects/${projectId}/archive`);
  },
  
  // Unarchive a project
  unarchive: (projectId) => {
    console.log(`📡 POST /projects/${projectId}/unarchive`);
    return api.post(`/projects/${projectId}/unarchive`);
  },
  
  // Clone a project
  clone: (projectId, newName) => {
    console.log(`📡 POST /projects/${projectId}/clone with name:`, newName);
    return api.post(`/projects/${projectId}/clone`, { name: newName });
  }
};

// ==================== TASK API ====================
export const taskAPI = {
  // Get all tasks with pagination and filters
  getAll: (projectId = null, page = 1, perPage = 20, status = null, search = null) => {
    console.log('📊 Fetching tasks with params:', { projectId, page, perPage, status, search });
    let url = `/tasks?page=${page}&per_page=${perPage}`;
    if (projectId) url += `&project_id=${projectId}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    console.log(`📡 GET ${url}`);
    return api.get(url);
  },
  
  // Get task by ID
  getById: (id) => {
    console.log(`📡 GET /tasks/${id}`);
    return api.get(`/tasks/${id}`);
  },
  
  // Create a new task
  create: (data) => {
    console.log('📡 POST /tasks with data:', data);
    const formattedData = {
      ...data,
      labels: data.labels || [],
      links: data.links || [],
      attachments: data.attachments || [],
      subtasks: data.subtasks || []
    };
    return api.post('/tasks', formattedData);
  },
  
  // Update a task
  update: (id, data) => {
    console.log(`📡 PUT /tasks/${id} with data:`, data);
    const formattedData = {
      ...data,
      labels: data.labels || [],
      links: data.links || [],
      attachments: data.attachments || [],
      subtasks: data.subtasks || []
    };
    return api.put(`/tasks/${id}`, formattedData);
  },
  
  // Delete a task
  delete: (id) => {
    console.log(`📡 DELETE /tasks/${id}`);
    return api.delete(`/tasks/${id}`);
  },
  
  // Update task status
  updateStatus: (id, status) => {
    console.log(`📡 PATCH /tasks/${id}/status with status:`, status);
    return api.patch(`/tasks/${id}/status`, { status });
  },
  
  // Assign a user to a task
  assignUser: (id, userId) => {
    console.log(`📡 POST /tasks/${id}/assign with user_id:`, userId);
    return api.post(`/tasks/${id}/assign`, { user_id: userId });
  },
  
  // Unassign a user from a task
  unassignUser: (id, userId) => {
    console.log(`📡 DELETE /tasks/${id}/assign with user_id:`, userId);
    return api.delete(`/tasks/${id}/assign`, { data: { user_id: userId } });
  },
  
  // Assign a member to a task
  assignMember: async (taskId, memberId) => {
    console.log(`📡 POST /tasks/${taskId}/assign with user_id:`, memberId);
    return api.post(`/tasks/${taskId}/assign`, { user_id: memberId });
  },
  
  // Unassign a member from a task
  unassignMember: async (taskId) => {
    console.log(`📡 DELETE /tasks/${taskId}/assign`);
    return api.delete(`/tasks/${taskId}/assign`);
  },
  
  // Get task statistics
  getStats: (id) => {
    console.log(`📡 GET /tasks/${id}/stats`);
    return api.get(`/tasks/${id}/stats`);
  },
  
  // Get tasks by project
  getByProject: (projectId) => {
    console.log(`📡 GET /tasks/project/${projectId}`);
    return api.get(`/tasks/project/${projectId}`);
  },
  
  // Get my tasks
  getMyTasks: () => {
    console.log('📡 GET /tasks/my-tasks');
    return api.get('/tasks/my-tasks');
  },
  
  // Add comment to task
  addComment: (taskId, comment) => {
    console.log(`📡 POST /tasks/${taskId}/comments with comment:`, comment);
    return api.post(`/tasks/${taskId}/comments`, { comment });
  },
  
  // Get task comments
  getComments: (taskId) => {
    console.log(`📡 GET /tasks/${taskId}/comments`);
    return api.get(`/tasks/${taskId}/comments`);
  },
  
  // Update task time
  updateTime: (taskId, hours) => {
    console.log(`📡 PATCH /tasks/${taskId}/time with hours:`, hours);
    return api.patch(`/tasks/${taskId}/time`, { hours });
  },
  
  // Get task activity
  getActivity: (taskId) => {
    console.log(`📡 GET /tasks/${taskId}/activity`);
    return api.get(`/tasks/${taskId}/activity`);
  },
  
  // Add attachment to task
  addAttachment: (taskId, file) => {
    console.log(`📡 POST /tasks/${taskId}/attachments`);
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Remove attachment from task
  removeAttachment: (taskId, attachmentId) => {
    console.log(`📡 DELETE /tasks/${taskId}/attachments/${attachmentId}`);
    return api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
  }
};

// ==================== USER API ====================
export const userAPI = {
  // Get all users with pagination
  getAll: (page = 1, perPage = 20, search = null) => {
    console.log('📊 Fetching users with params:', { page, perPage, search });
    let url = `/auth/users?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    console.log(`📡 GET ${url}`);
    return api.get(url);
  },
  
  // Get user by ID
  getById: (id) => {
    console.log(`📡 GET /auth/users/${id}`);
    return api.get(`/auth/users/${id}`);
  },
  
  // Update user
  update: (id, data) => {
    console.log(`📡 PUT /auth/users/${id} with data:`, data);
    return api.put(`/auth/users/${id}`, data);
  },
  
  // Delete user
  delete: (id) => {
    console.log(`📡 DELETE /auth/users/${id}`);
    return api.delete(`/auth/users/${id}`);
  },
  
  // Update user role
  updateRole: (id, role) => {
    console.log(`📡 PATCH /auth/users/${id}/role with role:`, role);
    return api.patch(`/auth/users/${id}/role`, { role });
  },
  
  // Get user statistics
  getStats: () => {
    console.log('📡 GET /auth/users/stats');
    return api.get('/auth/users/stats');
  }
};

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  // Get dashboard statistics
  getStats: () => {
    console.log('📡 GET /dashboard/stats');
    return api.get('/dashboard/stats');
  },
  
  // Get recent activity
  getRecentActivity: (limit = 10) => {
    console.log(`📡 GET /dashboard/activity?limit=${limit}`);
    return api.get(`/dashboard/activity?limit=${limit}`);
  },
  
  // Get project statistics
  getProjectStats: () => {
    console.log('📡 GET /dashboard/project-stats');
    return api.get('/dashboard/project-stats');
  },
  
  // Get task statistics
  getTaskStats: () => {
    console.log('📡 GET /dashboard/task-stats');
    return api.get('/dashboard/task-stats');
  },
  
  // Get user activity
  getUserActivity: (userId = null) => {
    console.log(`📡 GET /dashboard/user-activity${userId ? `?user_id=${userId}` : ''}`);
    return api.get(`/dashboard/user-activity${userId ? `?user_id=${userId}` : ''}`);
  },
  
  // Get project overview
  getProjectOverview: () => {
    console.log('📡 GET /dashboard/project-overview');
    return api.get('/dashboard/project-overview');
  }
};

// ==================== NOTIFICATION API ====================
export const notificationAPI = {
  // Get all notifications
  getAll: (page = 1, perPage = 20) => {
    console.log(`📡 GET /notifications?page=${page}&per_page=${perPage}`);
    return api.get(`/notifications?page=${page}&per_page=${perPage}`);
  },
  
  // Get unread notifications
  getUnread: () => {
    console.log('📡 GET /notifications/unread');
    return api.get('/notifications/unread');
  },
  
  // Mark notification as read
  markAsRead: (id) => {
    console.log(`📡 PATCH /notifications/${id}/read`);
    return api.patch(`/notifications/${id}/read`);
  },
  
  // Mark all notifications as read
  markAllAsRead: () => {
    console.log('📡 PATCH /notifications/read-all');
    return api.patch('/notifications/read-all');
  },
  
  // Delete notification
  delete: (id) => {
    console.log(`📡 DELETE /notifications/${id}`);
    return api.delete(`/notifications/${id}`);
  },
  
  // Delete all notifications
  deleteAll: () => {
    console.log('📡 DELETE /notifications/all');
    return api.delete('/notifications/all');
  },
  
  // Get notification preferences
  getPreferences: () => {
    console.log('📡 GET /notifications/preferences');
    return api.get('/notifications/preferences');
  },
  
  // Update notification preferences
  updatePreferences: (preferences) => {
    console.log('📡 PUT /notifications/preferences with data:', preferences);
    return api.put('/notifications/preferences', preferences);
  }
};

// ==================== COMMENT API ====================
export const commentAPI = {
  // Get comments by task
  getByTask: (taskId, page = 1, perPage = 20) => {
    console.log(`📡 GET /comments/task/${taskId}?page=${page}&per_page=${perPage}`);
    return api.get(`/comments/task/${taskId}?page=${page}&per_page=${perPage}`);
  },
  
  // Create a new comment
  create: (data) => {
    console.log('📡 POST /comments with data:', data);
    return api.post('/comments', data);
  },
  
  // Update a comment
  update: (id, data) => {
    console.log(`📡 PUT /comments/${id} with data:`, data);
    return api.put(`/comments/${id}`, data);
  },
  
  // Delete a comment
  delete: (id) => {
    console.log(`📡 DELETE /comments/${id}`);
    return api.delete(`/comments/${id}`);
  },
  
  // Get comment by ID
  getById: (id) => {
    console.log(`📡 GET /comments/${id}`);
    return api.get(`/comments/${id}`);
  }
};

// ==================== ATTACHMENT API ====================
export const attachmentAPI = {
  // Get attachments by task
  getByTask: (taskId) => {
    console.log(`📡 GET /attachments/task/${taskId}`);
    return api.get(`/attachments/task/${taskId}`);
  },
  
  // Upload a file
  upload: (taskId, file) => {
    console.log(`📡 POST /attachments/task/${taskId}`);
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/attachments/task/${taskId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // Delete an attachment
  delete: (id) => {
    console.log(`📡 DELETE /attachments/${id}`);
    return api.delete(`/attachments/${id}`);
  },
  
  // Download an attachment
  download: (id) => {
    console.log(`📡 GET /attachments/${id}/download`);
    return api.get(`/attachments/${id}/download`, {
      responseType: 'blob',
    });
  },
  
  // Get attachment by ID
  getById: (id) => {
    console.log(`📡 GET /attachments/${id}`);
    return api.get(`/attachments/${id}`);
  }
};

// ==================== DEFAULT EXPORT ====================
export default api;