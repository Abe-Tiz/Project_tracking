import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiFolder, 
  FiCheckSquare, 
  FiUsers,
  FiPlus,
  FiTrendingUp,
  FiClock,
  FiStar,
  FiMessageCircle,
  FiSettings,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiCalendar,
  FiTag,
  FiPaperclip,
  FiImage,
  FiLink,
  FiMoreVertical,
  FiX
} from 'react-icons/fi';
import { projectAPI, taskAPI, userAPI } from '../services/api';

// Stats Cards
const StatsCards = () => {
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    completed: 0,
    members: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        projectAPI.getAll(1, 1),
        taskAPI.getMyTasks(),
        userAPI.getAll(1, 1)
      ]);

      const tasks = tasksRes.data.tasks || [];
      const completed = tasks.filter(t => t.status === 'Done').length;

      setStats({
        projects: projectsRes.data.pagination?.total || 0,
        tasks: tasks.length,
        completed: completed,
        members: usersRes.data.pagination?.total || 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Projects',
      value: stats.projects,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      icon: FiFolder,
      link: '/dashboard/projects'
    },
    {
      title: 'Active Tasks',
      value: stats.tasks,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      icon: FiCheckSquare,
      link: '/dashboard/tasks'
    },
    {
      title: 'Completed Tasks',
      value: stats.completed,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      icon: FiTrendingUp,
      link: '/dashboard/tasks?status=Done'
    },
    {
      title: 'Users',
      value: stats.members,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      icon: FiUsers,
      link: '/dashboard/users'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Link key={index} to={card.link} className="block">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.bgColor}`}>
                <card.icon className={`text-${card.color.split('-')[1]}-600`} size={24} />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

// Project List View
const ProjectListView = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll(1, 100);
      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'bg-blue-100 text-blue-800 border-blue-200',
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completed': 'bg-purple-100 text-purple-800 border-purple-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'text-red-600 bg-red-50',
      'Medium': 'text-yellow-600 bg-yellow-50',
      'Low': 'text-green-600 bg-green-50'
    };
    return colors[priority] || 'text-gray-600';
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await projectAPI.delete(projectId);
      await fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Projects</h3>
          <Link to="/dashboard/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📁</div>
            <p className="text-gray-500 text-sm">No projects yet</p>
            <Link to="/dashboard/projects/new" className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {projects.map((project) => {
              const progress = Math.round(project.stats?.completion_rate || 0);
              return (
                <div 
                  key={project._id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => handleViewDetails(project)}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                        {project.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <FiClock className="mr-1" size={12} />
                          {project.stats?.total_tasks || 0} tasks
                        </span>
                        <span className="flex items-center">
                          <FiUsers className="mr-1" size={12} />
                          {project.members?.length || 1} members
                        </span>
                        {project.tags && project.tags.length > 0 && (
                          <span className="flex items-center">
                            <FiTag className="mr-1" size={12} />
                            {project.tags.slice(0, 2).join(', ')}
                            {project.tags.length > 2 && ` +${project.tags.length - 2}`}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1 ml-4">
                      <button
                        onClick={() => handleViewDetails(project)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <FiEye size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/projects/${project._id}/edit`)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Project"
                      >
                        <FiEdit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Project"
                      >
                        <FiTrash2 size={16} />
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Open Project"
                      >
                        <FiChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {showDetailModal && selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            navigate(`/dashboard/projects/${selectedProject._id}/edit`);
          }}
        />
      )}
    </>
  );
};

// Project Detail Modal
const ProjectDetailModal = ({ project, onClose, onEdit }) => {
  const navigate = useNavigate();
  const progress = Math.round(project.stats?.completion_rate || 0);

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'bg-blue-100 text-blue-800 border-blue-200',
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completed': 'bg-purple-100 text-purple-800 border-purple-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'High': 'text-red-600 bg-red-50',
      'Medium': 'text-yellow-600 bg-yellow-50',
      'Low': 'text-green-600 bg-green-50'
    };
    return colors[priority] || 'text-gray-600';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <FiX size={24} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
              >
                <FiEdit2 className="mr-2" size={16} />
                Edit
              </button>
              <button
                onClick={() => {
                  onClose();
                  navigate(`/dashboard/projects/${project._id}`);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
              >
                <FiEye className="mr-2" size={16} />
                Open
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {project.description || 'No description provided'}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Progress</h3>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Overall Completion</span>
            <span className="text-sm font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                progress >= 80 ? 'bg-green-500' :
                progress >= 50 ? 'bg-yellow-500' :
                progress >= 20 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-3 text-center text-sm">
            <div className="p-2 bg-gray-50 rounded-lg">
              <span className="block text-gray-500">Tasks</span>
              <span className="font-semibold text-gray-900">{project.stats?.total_tasks || 0}</span>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <span className="block text-gray-500">Completed</span>
              <span className="font-semibold text-green-600">{project.stats?.completed_tasks || 0}</span>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <span className="block text-gray-500">In Progress</span>
              <span className="font-semibold text-blue-600">{project.stats?.in_progress || 0}</span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {project.links && project.links.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Links</h3>
            <div className="space-y-2">
              {project.links.map((link, index) => (
                <a 
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <FiLink className="text-blue-600 mr-2" size={16} />
                  <span className="text-sm text-gray-700">{link.title || link.url}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Images */}
        {project.images && project.images.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {project.images.map((image, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={image.url || image} 
                    alt={image.filename || 'Project image'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {project.files && project.files.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Files</h3>
            <div className="space-y-2">
              {project.files.map((file, index) => (
                <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                  <FiPaperclip className="text-gray-500 mr-2" size={16} />
                  <span className="text-sm text-gray-700">{file.filename || file.name || 'File'}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Created</span>
              <p className="text-gray-900 font-medium">
                {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Updated</span>
              <p className="text-gray-900 font-medium">
                {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Start Date</span>
              <p className="text-gray-900 font-medium">
                {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">End Date</span>
              <p className="text-gray-900 font-medium">
                {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Quick Actions
const QuickActions = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        <Link 
          to="/dashboard/projects/new"
          className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group"
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow mb-3">
            <FiPlus className="text-blue-600" size={24} />
          </div>
          <span className="text-sm font-medium text-gray-700">New Project</span>
        </Link>
        <Link 
          to="/dashboard/tasks/new"
          className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group"
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow mb-3">
            <FiPlus className="text-purple-600" size={24} />
          </div>
          <span className="text-sm font-medium text-gray-700">New Task</span>
        </Link>
        <Link 
          to="/dashboard/users"
          className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group"
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow mb-3">
            <FiUsers className="text-green-600" size={24} />
          </div>
          <span className="text-sm font-medium text-gray-700">Users</span>
        </Link>
        <Link 
          to="/dashboard/settings"
          className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 group"
        >
          <div className="p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow mb-3">
            <FiSettings className="text-orange-600" size={24} />
          </div>
          <span className="text-sm font-medium text-gray-700">Settings</span>
        </Link>
      </div>
    </div>
  );
};

// ============ DASHBOARD OVERVIEW ============
const DashboardOverview = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
      {/* Welcome Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}! 👋
        </h2>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your projects and tasks.
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Projects List */}
      <ProjectListView />

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Active Projects</span>
              <span className="text-sm font-semibold text-gray-900">12</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Tasks in Progress</span>
              <span className="text-sm font-semibold text-gray-900">8</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Pending Reviews</span>
              <span className="text-sm font-semibold text-gray-900">3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;