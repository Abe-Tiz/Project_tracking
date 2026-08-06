

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { projectAPI } from '../services/api';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiSearch,
  FiX,
  FiClock,
  FiUser,
  FiCalendar,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiMoreVertical,
  FiImage,
  FiFile,
  FiLink,
  FiUpload,
  FiPaperclip,
  FiFolder,
  FiTag,
  FiGrid,
  FiList,
  FiArrowUp,
  FiArrowDown,
  FiStar,
  FiUsers
} from 'react-icons/fi';

/* ---------------------------------------------------------------------- *
 * Design tokens
 * Ink & Rail: a muted plum/indigo brand color paired with a warm ochre
 * counter-accent, set on a cool paper background. Headings use Fraunces
 * (a serif with real personality) so project names read like dossier
 * titles; body copy stays on Inter; counts, dates and stats sit in
 * IBM Plex Mono so data reads as data. If possible, move the @import
 * below into your global stylesheet/index.html instead of shipping it
 * per-component.
 * ---------------------------------------------------------------------- */
const DESIGN_FONTS = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
    .pj-display { font-family: 'Fraunces', serif; letter-spacing: -0.01em; }
    .pj-mono { font-family: 'IBM Plex Mono', monospace; }
    .pj-body { font-family: 'Inter', sans-serif; }
  `}</style>
);

const AVATAR_PALETTE = ['#3E3AA0', '#12786B', '#B23A48', '#C1741F', '#6B4E9C', '#2E6B8F'];

const getAvatarColor = (name = '') => {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('projectViewMode') || 'list';
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Form data matching backend expectations
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Planning',
    priority: 'Medium',
    start_date: '',
    end_date: '',
  });

  // Separate state for files, images, links, tags (will be appended to FormData)
  const [uploadData, setUploadData] = useState({
    files: [],        // Array of File objects for documents
    images: [],       // Array of File objects for images
    links: [],        // Array of {title, url} objects
    tags: []          // Array of tag strings
  });

  const [newTag, setNewTag] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [showLinkInput, setShowLinkInput] = useState(false);

  // Save view mode to localStorage when changed
  useEffect(() => {
    localStorage.setItem('projectViewMode', viewMode);
  }, [viewMode]);

  // Sort projects function
  const sortProjects = useCallback((projectsList) => {
    const sorted = [...projectsList];
    sorted.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'name':
          valA = a.name?.toLowerCase() || '';
          valB = b.name?.toLowerCase() || '';
          break;
        case 'status':
          valA = a.status || '';
          valB = b.status || '';
          break;
        case 'priority':
          const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
          valA = priorityOrder[a.priority] || 0;
          valB = priorityOrder[b.priority] || 0;
          break;
        case 'progress':
          valA = a.stats?.completion_rate || 0;
          valB = b.stats?.completion_rate || 0;
          break;
        case 'tasks':
          valA = a.stats?.total_tasks || 0;
          valB = b.stats?.total_tasks || 0;
          break;
        case 'created_at':
        default:
          valA = new Date(a.created_at || 0).getTime();
          valB = new Date(b.created_at || 0).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
    return sorted;
  }, [sortBy, sortOrder]);

  // Fetch projects function
  const fetchProjects = useCallback(async () => {
    try {
      console.log('📊 Fetching projects...');
      setLoading(true);
      setError('');

      const token = localStorage.getItem('access_token');
      console.log('🔑 Using token:', token ? 'Present' : 'Missing');

      if (!token) {
        console.warn('⚠️ No token available');
        setError('Authentication required. Please login.');
        setLoading(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      console.log(`🔍 Request params - page: 1, per_page: 100, status: "${statusFilter}", search: "${searchTerm}", priority: "${priorityFilter}"`);

      const response = await projectAPI.getAll(1, 100, statusFilter, searchTerm, priorityFilter);

      console.log('✅ Projects fetched successfully');
      console.log('📊 Response data:', response.data);
      console.log(`📊 Total projects: ${response.data.projects?.length || 0}`);

      let projectsData = response.data.projects || [];

      // Sort projects
      projectsData = sortProjects(projectsData);

      setProjects(projectsData);
      setError('');
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });

      if (error.response?.status === 401) {
        console.warn('⚠️ Authentication failed, redirecting to login...');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setError('Session expired. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check if the server is running.');
      } else {
        setError(`Failed to load projects: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setLoading(false);
      console.log('📊 Fetch complete, loading:', false);
    }
  }, [statusFilter, searchTerm, priorityFilter, sortProjects, navigate]);

  // Check authentication on mount
  useEffect(() => {
    console.log('🔄 Projects component mounted');
    console.log('👤 Current user from context:', user);

    const token = localStorage.getItem('access_token');
    console.log('🔑 Token present:', !!token);

    if (!token) {
      console.warn('⚠️ No token found, redirecting to login...');
      setError('Please login to view projects');
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    setIsAuthenticated(true);
    console.log('✅ User is authenticated');
    fetchProjects();

    return () => {
      console.log('🔄 Projects component unmounted');
    };
  }, []);

  // Fetch projects when filters change
  useEffect(() => {
    if (isAuthenticated) {
      console.log('📊 Filters changed:', { searchTerm, statusFilter, priorityFilter, sortBy, sortOrder });
      fetchProjects();
    }
  }, [searchTerm, statusFilter, priorityFilter, sortBy, sortOrder, isAuthenticated, fetchProjects]);

  // Handle file upload
  const handleFileUpload = (e, type) => {
    const files = Array.from(e.target.files);
    console.log(`📁 Uploading ${files.length} ${type}(s)`);

    if (type === 'images') {
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      setUploadData(prev => ({
        ...prev,
        images: [...prev.images, ...imageFiles]
      }));
    } else {
      const documentFiles = files.filter(file => !file.type.startsWith('image/'));
      setUploadData(prev => ({
        ...prev,
        files: [...prev.files, ...documentFiles]
      }));
    }

    if (type === 'images' && imageInputRef.current) {
      imageInputRef.current.value = '';
    } else if (type === 'files' && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (index, type) => {
    console.log(`🗑️ Removing ${type} at index ${index}`);
    setUploadData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const addLink = () => {
    if (newLink.title && newLink.url) {
      console.log('🔗 Adding link:', newLink);
      setUploadData(prev => ({
        ...prev,
        links: [...prev.links, { ...newLink, id: Date.now() }]
      }));
      setNewLink({ title: '', url: '' });
      setShowLinkInput(false);
    }
  };

  const removeLink = (index) => {
    console.log(`🔗 Removing link at index ${index}`);
    setUploadData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      console.log('🏷️ Adding tag:', newTag);
      setUploadData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index) => {
    console.log(`🏷️ Removing tag at index ${index}`);
    setUploadData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    console.log('📝 Creating new project...');
    setSubmitting(true);
    setError('');
    setUploadProgress(0);

    try {
      // Create FormData object matching backend expectations
      const formDataToSend = new FormData();

      // Add basic fields - these must match what backend expects
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('status', formData.status);
      formDataToSend.append('priority', formData.priority);
      
      // Only append dates if they have values
      if (formData.start_date) {
        formDataToSend.append('start_date', formData.start_date);
      }
      if (formData.end_date) {
        formDataToSend.append('end_date', formData.end_date);
      }

      // Add tags - backend expects 'tags[]' for multiple tags
      uploadData.tags.forEach(tag => {
        formDataToSend.append('tags[]', tag);
      });

      // Add links - backend expects 'links[]' as JSON strings
      uploadData.links.forEach(link => {
        const linkData = {
          title: link.title,
          url: link.url
        };
        formDataToSend.append('links[]', JSON.stringify(linkData));
      });

      // Add images - backend expects 'images[index]' format
      uploadData.images.forEach((file, index) => {
        formDataToSend.append(`images[${index}]`, file);
      });

      // Add files - backend expects 'files[index]' format
      uploadData.files.forEach((file, index) => {
        formDataToSend.append(`files[${index}]`, file);
      });

      // Log what we're sending (for debugging)
      console.log('📤 Sending FormData:');
      for (let [key, value] of formDataToSend.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: ${value.name} (${value.type}, ${value.size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      const response = await projectAPI.create(formDataToSend);

      console.log('✅ Project created successfully:', response.data);

      // Reset form
      setFormData({
        name: '',
        description: '',
        status: 'Planning',
        priority: 'Medium',
        start_date: '',
        end_date: '',
      });
      setUploadData({
        files: [],
        images: [],
        links: [],
        tags: []
      });

      setShowCreateModal(false);
      setUploadProgress(0);

      await fetchProjects();
      console.log('🔄 Projects list refreshed after create');
    } catch (error) {
      console.error('❌ Failed to create project:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Failed to create project. Please try again.');
      }
    } finally {
      setSubmitting(false);
      console.log('📝 Create complete');
    }
  };

  const handleDelete = async (projectId) => {
    console.log(`🗑️ Delete project ${projectId} initiated`);
    if (!window.confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      console.log('🗑️ Delete cancelled by user');
      return;
    }

    try {
      console.log(`🗑️ Deleting project ${projectId}...`);
      const response = await projectAPI.delete(projectId);
      console.log('✅ Project deleted:', response.data);

      await fetchProjects();
      console.log('🔄 Projects list refreshed after delete');
    } catch (error) {
      console.error(`❌ Failed to delete project ${projectId}:`, error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      if (error.response?.status === 401) {
        setError('Session expired. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(`Failed to delete project: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  /* -------------------------- design helpers -------------------------- */

  const getStatusStyle = (status) => {
    const styles = {
      'Planning': { bg: '#EDEBFB', text: '#3E3AA0', dot: '#3E3AA0' },
      'Active': { bg: '#E4F2EE', text: '#12786B', dot: '#12786B' },
      'On Hold': { bg: '#FBECD9', text: '#C1741F', dot: '#C1741F' },
      'Completed': { bg: '#EFE7F5', text: '#6B4E9C', dot: '#6B4E9C' },
      'Cancelled': { bg: '#F7E6E8', text: '#B23A48', dot: '#B23A48' }
    };
    return styles[status] || { bg: '#EEEEEC', text: '#5B5A56', dot: '#8A8985' };
  };

  const getPriorityStyle = (priority) => {
    const styles = {
      'High': { text: '#B23A48', icon: <FiArrowUp size={12} /> },
      'Medium': { text: '#C1741F', icon: <FiArrowUp size={12} /> },
      'Low': { text: '#12786B', icon: <FiArrowDown size={12} /> }
    };
    return styles[priority] || { text: '#8A8985', icon: null };
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#12786B';
    if (progress >= 50) return '#C1741F';
    if (progress >= 20) return '#B26A2E';
    return '#B23A48';
  };

  const renderFilePreview = (file, index, type) => {
    const isImage = file.type?.startsWith('image/');
    const fileSize = (file.size / 1024 / 1024).toFixed(2);

    return (
      <div key={index} className="relative group bg-[#FAF9F6] rounded-lg p-3 border border-[#E7E5E0] hover:border-[#3E3AA0]/40 transition-all">
        <button
          onClick={() => removeUploadedFile(index, type)}
          className="absolute -top-2 -right-2 p-1 bg-[#B23A48] text-white rounded-full hover:bg-[#98303C] transition-colors shadow-md opacity-0 group-hover:opacity-100"
        >
          <FiX size={12} />
        </button>
        <div className="flex items-center space-x-3">
          {isImage ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#EEEEEC] flex-shrink-0">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-[#EDEBFB] text-[#3E3AA0] flex items-center justify-center flex-shrink-0">
              <FiFile size={22} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#1B1B1E] truncate pj-body">{file.name}</p>
            <p className="text-xs text-[#8A8985] pj-mono">{fileSize} MB</p>
          </div>
        </div>
      </div>
    );
  };

  // Unified avatar stack for project members
  const renderMemberAvatars = (project, max = 4) => {
    const members = project.members && project.members.length > 0
      ? project.members
      : [{ name: project.owner_name || 'Owner' }];
    const visible = members.slice(0, max);
    const overflow = members.length - visible.length;

    return (
      <div className="flex items-center -space-x-2">
        {visible.map((m, idx) => {
          const name = m.name || m.owner_name || 'Member';
          return (
            <div
              key={idx}
              title={name}
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white ring-2 ring-white pj-mono"
              style={{ backgroundColor: getAvatarColor(name), zIndex: visible.length - idx }}
            >
              {getInitials(name)}
            </div>
          );
        })}
        {overflow > 0 && (
          <div className="w-7 h-7 rounded-full bg-[#EEEEEC] text-[#5B5A56] ring-2 ring-white flex items-center justify-center text-[10px] font-semibold pj-mono">
            +{overflow}
          </div>
        )}
      </div>
    );
  };

  // The signature element: a single content rail that surfaces everything
  // attached to a project (members, tasks, images, files, links) as one
  // legible strip instead of scattered badges.
  const renderContentRail = (project, compact = false) => {
    const imageCount = project.images?.length || 0;
    const fileCount = project.files?.length || 0;
    const linkCount = project.links?.length || 0;
    const taskCount = project.stats?.total_tasks || 0;

    const Stat = ({ icon, count, label }) => (
      <span className="flex items-center gap-1 text-[#5B5A56]" title={label}>
        {icon}
        <span className="pj-mono text-xs">{count}</span>
      </span>
    );

    return (
      <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'} flex-wrap`}>
        {renderMemberAvatars(project, compact ? 3 : 4)}
        <span className="w-px h-4 bg-[#E7E5E0]" />
        <Stat icon={<FiClock size={13} />} count={taskCount} label="Tasks" />
        {imageCount > 0 && <Stat icon={<FiImage size={13} />} count={imageCount} label="Images" />}
        {fileCount > 0 && <Stat icon={<FiPaperclip size={13} />} count={fileCount} label="Files" />}
        {linkCount > 0 && <Stat icon={<FiLink size={13} />} count={linkCount} label="Links" />}
      </div>
    );
  };

  const renderImageStrip = (project) => {
    if (!project.images || project.images.length === 0) return null;
    return (
      <div className="flex gap-1.5 mb-3">
        {project.images.slice(0, 4).map((image, idx) => (
          <div key={idx} className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#EEEEEC] border border-[#E7E5E0]">
            <img
              src={image.url || image}
              alt={image.name || 'Project image'}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {project.images.length > 4 && (
          <div className="w-11 h-11 rounded-lg bg-[#F2F1ED] flex items-center justify-center text-xs text-[#8A8985] flex-shrink-0 pj-mono">
            +{project.images.length - 4}
          </div>
        )}
      </div>
    );
  };

  const renderProjectCard = (project) => {
    const progress = Math.round(project.stats?.completion_rate || 0);
    const statusStyle = getStatusStyle(project.status);
    const priorityStyle = getPriorityStyle(project.priority);

    return (
      <div
        key={project._id}
        className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group border border-[#E7E5E0] relative"
      >
        {/* status ribbon */}
        <div className="h-[3px] w-full" style={{ backgroundColor: statusStyle.dot }} />

        <div className="p-6">
          <div className="flex justify-between items-start mb-3 gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priorityStyle.text }} />
                <span className="text-[11px] uppercase tracking-wide pj-mono" style={{ color: priorityStyle.text }}>
                  {project.priority} priority
                </span>
              </div>
              <h3 className="pj-display text-lg font-semibold text-[#1B1B1E] truncate group-hover:text-[#3E3AA0] transition-colors">
                {project.name}
              </h3>
            </div>
            <span
              className="px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap pj-body"
              style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
            >
              {project.status}
            </span>
          </div>

          <p className="text-sm text-[#5B5A56] line-clamp-2 mb-4 min-h-[40px] pj-body">
            {project.description || 'No description provided'}
          </p>

          {renderImageStrip(project)}

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-[#F2F1ED] text-[#5B5A56] text-xs rounded-full pj-body">
                  #{tag}
                </span>
              ))}
              {project.tags.length > 3 && (
                <span className="px-2 py-0.5 bg-[#F2F1ED] text-[#5B5A56] text-xs rounded-full pj-mono">
                  +{project.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="mb-4">
            <div className="flex justify-between text-xs text-[#8A8985] mb-1 pj-body">
              <span>Progress</span>
              <span className="font-medium pj-mono" style={{ color: getProgressColor(progress) }}>{progress}%</span>
            </div>
            <div className="w-full bg-[#EEEEEC] rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${progress}%`, backgroundColor: getProgressColor(progress) }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#EFEDE8]">
            {renderContentRail(project, true)}
            <div className="flex items-center space-x-1 ml-2">
              <button
                onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                className="p-2 text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
                title="View Project"
              >
                <FiEye size={17} />
              </button>
              <button
                onClick={() => navigate(`/dashboard/projects/${project._id}/edit`)}
                className="p-2 text-[#12786B] hover:bg-[#E4F2EE] rounded-lg transition-colors"
                title="Edit Project"
              >
                <FiEdit2 size={17} />
              </button>
              <button
                onClick={() => handleDelete(project._id)}
                className="p-2 text-[#B23A48] hover:bg-[#F7E6E8] rounded-lg transition-colors"
                title="Delete Project"
              >
                <FiTrash2 size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectListItem = (project) => {
    const progress = Math.round(project.stats?.completion_rate || 0);
    const statusStyle = getStatusStyle(project.status);
    const priorityStyle = getPriorityStyle(project.priority);

    return (
      <div
        key={project._id}
        className="bg-white border border-[#E7E5E0] rounded-xl hover:border-[#3E3AA0]/30 hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        <div className="flex">
          <div className="w-1 flex-shrink-0" style={{ backgroundColor: statusStyle.dot }} />
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                  <h4 className="pj-display font-semibold text-[#1B1B1E] hover:text-[#3E3AA0] transition-colors">
                    {project.name}
                  </h4>
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded-full pj-body"
                    style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                  >
                    {project.status}
                  </span>
                  <span className="text-xs font-medium flex items-center gap-1 pj-body" style={{ color: priorityStyle.text }}>
                    {priorityStyle.icon}
                    {project.priority}
                  </span>
                </div>

                <p className="text-sm text-[#5B5A56] line-clamp-1 mt-1 pj-body">
                  {project.description || 'No description provided'}
                </p>

                <div className="mt-3">
                  {renderContentRail(project)}
                </div>

                {project.tags && project.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <FiTag size={11} className="text-[#8A8985]" />
                    <span className="text-xs text-[#8A8985] pj-body">
                      {project.tags.slice(0, 3).join(', ')}
                      {project.tags.length > 3 && ` +${project.tags.length - 3}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-5 ml-4 flex-shrink-0">
                <div className="w-24">
                  <div className="flex justify-between text-xs text-[#8A8985] mb-1 pj-body">
                    <span>Progress</span>
                    <span className="font-medium pj-mono" style={{ color: getProgressColor(progress) }}>{progress}%</span>
                  </div>
                  <div className="w-full bg-[#EEEEEC] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: getProgressColor(progress) }}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => navigate(`/dashboard/projects/${project._id}`)}
                    className="p-1.5 text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
                    title="View Project"
                  >
                    <FiEye size={16} />
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/projects/${project._id}/edit`)}
                    className="p-1.5 text-[#12786B] hover:bg-[#E4F2EE] rounded-lg transition-colors"
                    title="Edit Project"
                  >
                    <FiEdit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(project._id)}
                    className="p-1.5 text-[#B23A48] hover:bg-[#F7E6E8] rounded-lg transition-colors"
                    title="Delete Project"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Log render
  console.log(`🖥️ Rendering Projects with ${projects.length} projects, loading: ${loading}`);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 pj-body">
        {DESIGN_FONTS}
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E3AA0]"></div>
        <p className="mt-4 text-[#5B5A56] text-sm">Loading projects...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pj-body">
      {DESIGN_FONTS}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="pj-display text-3xl font-semibold text-[#1B1B1E]">Projects</h1>
          <p className="text-sm text-[#8A8985] mt-1">Manage all your projects and track their progress</p>
        </div>
        <button
          onClick={() => {
            console.log('📝 Opening create project modal');
            setShowCreateModal(true);
            setError('');
          }}
          className="inline-flex items-center px-4 py-2.5 rounded-xl shadow-sm text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] transition-colors"
        >
          <FiPlus className="mr-2" />
          New Project
        </button>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E7E5E0] p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A8985]" />
            <input
              type="text"
              placeholder="Search projects by name or description..."
              value={searchTerm}
              onChange={(e) => {
                console.log(`🔍 Search term changed: ${e.target.value}`);
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E7E5E0] rounded-xl focus:ring-2 focus:ring-[#3E3AA0]/30 focus:border-[#3E3AA0] outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#F2F1ED] rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white text-[#3E3AA0] shadow-sm' : 'text-[#8A8985] hover:text-[#5B5A56]'}`}
              title="List View"
            >
              <FiList size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white text-[#3E3AA0] shadow-sm' : 'text-[#8A8985] hover:text-[#5B5A56]'}`}
              title="Grid View"
            >
              <FiGrid size={18} />
            </button>
          </div>

          <button
            onClick={() => {
              console.log(`🔍 Toggling filters: ${!showFilters}`);
              setShowFilters(!showFilters);
            }}
            className="inline-flex items-center px-4 py-2.5 border border-[#E7E5E0] rounded-xl hover:bg-[#F7F6F3] transition-colors text-sm text-[#5B5A56]"
          >
            <FiFilter className="mr-2" />
            Filters
            {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
          </button>

          {(searchTerm || statusFilter || priorityFilter) && (
            <button
              onClick={() => {
                console.log('🧹 Clearing all filters');
                setSearchTerm('');
                setStatusFilter('');
                setPriorityFilter('');
              }}
              className="text-sm text-[#8A8985] hover:text-[#5B5A56] flex items-center px-2"
            >
              <FiX className="mr-1" /> Clear all
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-[#EFEDE8] grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#5B5A56] mb-1 pj-mono uppercase tracking-wide">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  console.log(`🔍 Status filter changed to: ${e.target.value}`);
                  setStatusFilter(e.target.value);
                }}
                className="w-full px-3 py-2 border border-[#E7E5E0] rounded-lg focus:ring-2 focus:ring-[#3E3AA0]/30 focus:border-[#3E3AA0] outline-none text-sm"
              >
                <option value="">All Status</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5B5A56] mb-1 pj-mono uppercase tracking-wide">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  console.log(`🔍 Priority filter changed to: ${e.target.value}`);
                  setPriorityFilter(e.target.value);
                }}
                className="w-full px-3 py-2 border border-[#E7E5E0] rounded-lg focus:ring-2 focus:ring-[#3E3AA0]/30 focus:border-[#3E3AA0] outline-none text-sm"
              >
                <option value="">All Priority</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5B5A56] mb-1 pj-mono uppercase tracking-wide">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-[#E7E5E0] rounded-lg focus:ring-2 focus:ring-[#3E3AA0]/30 focus:border-[#3E3AA0] outline-none text-sm"
              >
                <option value="created_at">Date Created</option>
                <option value="name">Name</option>
                <option value="status">Status</option>
                <option value="priority">Priority</option>
                <option value="progress">Progress</option>
                <option value="tasks">Task Count</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5B5A56] mb-1 pj-mono uppercase tracking-wide">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3 py-2 border border-[#E7E5E0] rounded-lg focus:ring-2 focus:ring-[#3E3AA0]/30 focus:border-[#3E3AA0] outline-none text-sm"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-[#F7E6E8] border border-[#EAC3C8] rounded-xl">
          <p className="text-sm text-[#B23A48]">{error}</p>
          {!error.includes('login') && (
            <button
              onClick={() => {
                console.log('🔄 Retrying fetch after error');
                fetchProjects();
              }}
              className="mt-2 text-sm text-[#98303C] hover:text-[#7A2731] underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Projects Count */}
      <div className="mb-4 text-sm text-[#8A8985] pj-mono">
        {projects.length} {projects.length === 1 ? 'project' : 'projects'} found
      </div>

      {/* Projects Display */}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#E7E5E0]">
          <div className="w-16 h-16 rounded-2xl bg-[#EDEBFB] text-[#3E3AA0] flex items-center justify-center mx-auto mb-4">
            <FiFolder size={28} />
          </div>
          <h3 className="pj-display text-lg font-semibold text-[#1B1B1E] mb-2">No projects yet</h3>
          <p className="text-[#8A8985] mb-5 text-sm">Get started by creating your first project</p>
          <button
            onClick={() => {
              console.log('📝 Opening create project modal from empty state');
              setShowCreateModal(true);
              setError('');
            }}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] transition-colors"
          >
            <FiPlus className="mr-2" />
            Create Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(renderProjectCard)}
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(renderProjectListItem)}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                console.log('❌ Closing create modal');
                setShowCreateModal(false);
                setError('');
                setFormData({
                  name: '',
                  description: '',
                  status: 'Planning',
                  priority: 'Medium',
                  start_date: '',
                  end_date: '',
                });
                setUploadData({
                  files: [],
                  images: [],
                  links: [],
                  tags: []
                });
                setUploadProgress(0);
              }}
              className="absolute top-4 right-4 text-[#8A8985] hover:text-[#1B1B1E] transition-colors z-10"
            >
              <FiX size={22} />
            </button>

            <h3 className="pj-display text-xl font-semibold text-[#1B1B1E] mb-4">Create New Project</h3>

            {error && (
              <div className="mb-4 p-3 bg-[#F7E6E8] border border-[#EAC3C8] rounded-lg">
                <p className="text-sm text-[#B23A48]">{error}</p>
              </div>
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-[#5B5A56] mb-1 pj-body">
                  <span>Uploading...</span>
                  <span className="pj-mono">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-[#EEEEEC] rounded-full h-2">
                  <div
                    className="bg-[#3E3AA0] rounded-full h-2 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#5B5A56]">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    console.log(`📝 Project name: ${e.target.value}`);
                    setFormData({...formData, name: e.target.value});
                  }}
                  className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#5B5A56]">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => {
                    console.log(`📝 Project description: ${e.target.value.substring(0, 50)}...`);
                    setFormData({...formData, description: e.target.value});
                  }}
                  className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                  placeholder="Describe your project"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5B5A56]">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => {
                      console.log(`📝 Status: ${e.target.value}`);
                      setFormData({...formData, status: e.target.value});
                    }}
                    className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5B5A56]">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => {
                      console.log(`📝 Priority: ${e.target.value}`);
                      setFormData({...formData, priority: e.target.value});
                    }}
                    className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#5B5A56]">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => {
                      console.log(`📝 Start date: ${e.target.value}`);
                      setFormData({...formData, start_date: e.target.value});
                    }}
                    className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#5B5A56]">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => {
                      console.log(`📝 End date: ${e.target.value}`);
                      setFormData({...formData, end_date: e.target.value});
                    }}
                    className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-[#5B5A56]">Tags</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="flex-1 rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                    placeholder="Add a tag..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-[#3E3AA0] text-white rounded-xl hover:bg-[#33308A] transition-colors text-sm"
                  >
                    Add
                  </button>
                </div>
                {uploadData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {uploadData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-[#EDEBFB] text-[#3E3AA0] rounded-full text-sm">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="hover:text-[#B23A48] transition-colors"
                        >
                          <FiX size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Links */}
              <div>
                <label className="block text-sm font-medium text-[#5B5A56]">Links</label>
                {!showLinkInput ? (
                  <button
                    type="button"
                    onClick={() => setShowLinkInput(true)}
                    className="mt-1 inline-flex items-center px-4 py-2 border border-[#E7E5E0] rounded-xl hover:bg-[#F7F6F3] transition-colors text-sm text-[#5B5A56]"
                  >
                    <FiLink className="mr-2" />
                    Add Link
                  </button>
                ) : (
                  <div className="mt-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Link title"
                      value={newLink.title}
                      onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                      className="block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                    />
                    <input
                      type="url"
                      placeholder="Link URL"
                      value={newLink.url}
                      onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                      className="block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={addLink}
                        className="px-4 py-2 bg-[#12786B] text-white rounded-xl hover:bg-[#0F6459] transition-colors text-sm"
                      >
                        Add Link
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLinkInput(false);
                          setNewLink({ title: '', url: '' });
                        }}
                        className="px-4 py-2 bg-[#F2F1ED] text-[#5B5A56] rounded-xl hover:bg-[#E7E5E0] transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {uploadData.links.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadData.links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-[#FAF9F6] rounded-lg border border-[#E7E5E0]">
                        <div className="flex items-center gap-2 min-w-0">
                          <FiLink className="text-[#3E3AA0] flex-shrink-0" />
                          <span className="text-sm text-[#1B1B1E] flex-shrink-0">{link.title}</span>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#3E3AA0] hover:underline truncate">
                            {link.url}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="text-[#B23A48] hover:text-[#98303C] transition-colors flex-shrink-0"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* File Uploads */}
              <div>
                <label className="block text-sm font-medium text-[#5B5A56]">Files & Images</label>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={(e) => handleFileUpload(e, 'files')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-[#E7E5E0] rounded-xl hover:border-[#3E3AA0]/50 hover:bg-[#EDEBFB]/30 transition-colors"
                    >
                      <FiFile className="mr-2 text-[#8A8985]" />
                      <span className="text-sm text-[#5B5A56]">Upload Files</span>
                    </button>
                  </div>
                  <div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'images')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-[#E7E5E0] rounded-xl hover:border-[#3E3AA0]/50 hover:bg-[#EDEBFB]/30 transition-colors"
                    >
                      <FiImage className="mr-2 text-[#8A8985]" />
                      <span className="text-sm text-[#5B5A56]">Upload Images</span>
                    </button>
                  </div>
                </div>

                {/* Uploaded Images Preview */}
                {uploadData.images.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-[#5B5A56] mb-2">Images ({uploadData.images.length})</p>
                    <div className="grid grid-cols-3 gap-2">
                      {uploadData.images.map((file, index) => renderFilePreview(file, index, 'images'))}
                    </div>
                  </div>
                )}

                {/* Uploaded Files Preview */}
                {uploadData.files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-[#5B5A56] mb-2">Files ({uploadData.files.length})</p>
                    <div className="space-y-2">
                      {uploadData.files.map((file, index) => renderFilePreview(file, index, 'files'))}
                    </div>
                  </div>
                )}
              </div>

              {/* Project Summary */}
              {(uploadData.images.length > 0 || uploadData.files.length > 0 || uploadData.links.length > 0 || uploadData.tags.length > 0) && (
                <div className="p-4 bg-[#EDEBFB] rounded-xl border border-[#DAD6F2]">
                  <p className="text-sm font-medium text-[#3E3AA0] mb-2 pj-mono uppercase tracking-wide">Project Summary</p>
                  <div className="flex flex-wrap gap-3 text-sm text-[#3E3AA0]">
                    {uploadData.tags.length > 0 && (
                      <span className="flex items-center gap-1"><FiTag size={13} /> {uploadData.tags.length} tags</span>
                    )}
                    {uploadData.images.length > 0 && (
                      <span className="flex items-center gap-1"><FiImage size={13} /> {uploadData.images.length} images</span>
                    )}
                    {uploadData.files.length > 0 && (
                      <span className="flex items-center gap-1"><FiFile size={13} /> {uploadData.files.length} files</span>
                    )}
                    {uploadData.links.length > 0 && (
                      <span className="flex items-center gap-1"><FiLink size={13} /> {uploadData.links.length} links</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-[#EFEDE8]">
                <button
                  type="button"
                  onClick={() => {
                    console.log('❌ Cancelling project creation');
                    setShowCreateModal(false);
                    setError('');
                    setFormData({
                      name: '',
                      description: '',
                      status: 'Planning',
                      priority: 'Medium',
                      start_date: '',
                      end_date: '',
                    });
                    setUploadData({
                      files: [],
                      images: [],
                      links: [],
                      tags: []
                    });
                    setUploadProgress(0);
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#5B5A56] bg-[#F2F1ED] hover:bg-[#E7E5E0] rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;