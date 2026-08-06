import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlus, FiX, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { taskAPI, projectAPI } from '../services/api';
import { 
  TaskHeader, 
  TaskFilters, 
  TaskCard, 
  TaskListItem, 
  TaskFormModal,
  DESIGN_FONTS,
  PLACEHOLDER_IMAGE
} from '../components/tasks';
import { LoadingSpinner } from '../components/ui';
import { ReportViewer } from '../components/reports/ReportViewer';
import { ReportGenerator } from '../components/reports/ReportGenerator';
import { WeeklyReportGenerator } from '../components/reports/WeeklyReportGenerator';

const createBlobUrl = (file) => {
  const url = URL.createObjectURL(file);
  return url;
};

const revokeBlobUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch (e) {}
  }
};

const isValidImageUrl = (url) => {
  if (!url) return false;
  return url.startsWith('http') || url.startsWith('data:image') || url.startsWith('/uploads/');
};

const isBlobUrl = (url) => {
  return url && typeof url === 'string' && url.startsWith('blob:');
};

const TaskBoard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  
  // State
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('Todo');
  const [editingTask, setEditingTask] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('taskViewMode') || 'board';
  });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterMember, setFilterMember] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Report states
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);

  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    due_date: '',
    estimated_hours: 0,
    assigned_to: '',
    assigned_to_name: '',
    attachments: [],
    links: [],
    labels: [],
    subtasks: []
  });

  const columns = ['Todo', 'In Progress', 'Review', 'Done'];

  useEffect(() => {
    localStorage.setItem('taskViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Report handlers
  const handleReportGenerated = (report) => {
    setCurrentReport(report);
    setShowReportViewer(true);
  };

  const handleReportViewerClose = () => {
    setShowReportViewer(false);
    setCurrentReport(null);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [projectRes, tasksRes] = await Promise.all([
        projectAPI.getById(projectId),
        taskAPI.getByProject(projectId)
      ]);
      
      const projectData = projectRes.data;
      
      // Fetch members with details
      let membersData = [];
      try {
        const membersRes = await projectAPI.getMembers(projectId);
        membersData = membersRes.data.members || [];
      } catch (error) {
        console.warn('Could not fetch members details, using basic members:', error);
        // Fallback: use members from project
        if (projectData.members) {
          membersData = projectData.members.map(id => ({
            _id: id,
            name: 'Unknown',
            email: '',
            role: 'Team Member'
          }));
        }
      }
      
      setMembers(membersData);
      
      const tasksData = (tasksRes.data.tasks || []).map(task => ({
        ...task,
        labels: task.labels || [],
        attachments: (task.attachments || []).map(att => ({
          ...att,
          isValid: !isBlobUrl(att.url),
          displayUrl: isValidImageUrl(att.url) ? att.url : PLACEHOLDER_IMAGE,
          preview: null,
          file: null,
          isNew: false,
          isExisting: true
        })),
        links: (task.links || []).map(link => {
          if (typeof link === 'string') {
            try {
              const parsed = JSON.parse(link);
              return { ...parsed, id: `link-${Date.now()}-${Math.random()}` };
            } catch {
              return { url: link, title: link, id: `link-${Date.now()}-${Math.random()}` };
            }
          }
          return { ...link, id: `link-${Date.now()}-${Math.random()}` };
        }),
        subtasks: (task.subtasks || []).map(sub => ({
          ...sub,
          id: `subtask-${Date.now()}-${Math.random()}`
        })),
        comments: task.comments || []
      }));
      
      setProject(projectData);
      setTasks(tasksData);
      
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // File helpers
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // CRUD operations
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const attachmentsToSubmit = [];
      
      for (const att of formData.attachments) {
        if (att.isNew && att.file) {
          try {
            const base64Data = await fileToBase64(att.file);
            attachmentsToSubmit.push({
              name: att.name,
              type: att.type,
              size: att.size,
              url: base64Data,
              file_id: att.id,
              isNew: true
            });
          } catch (error) {
            console.error('Failed to convert file:', error);
          }
        } else if (att.isExisting) {
          attachmentsToSubmit.push({
            name: att.name,
            type: att.type,
            size: att.size,
            url: isValidImageUrl(att.url) ? att.url : '',
            file_id: att.id,
            isExisting: true
          });
        }
      }

      const taskData = { 
        ...formData,
        project_id: projectId,
        status: selectedStatus || formData.status,
        attachments: attachmentsToSubmit,
        links: formData.links.map(link => ({
          title: link.label || link.title || link.url || '',
          url: link.url || ''
        })),
        subtasks: formData.subtasks.map(sub => ({
          title: sub.title,
          completed: sub.completed || false
        }))
      };
      
      await taskAPI.create(taskData);
      await fetchData();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Create error:', error);
      setError(error.response?.data?.error || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const attachmentsToSubmit = [];
      
      for (const att of formData.attachments) {
        if (att.isNew && att.file) {
          try {
            const base64Data = await fileToBase64(att.file);
            attachmentsToSubmit.push({
              name: att.name,
              type: att.type,
              size: att.size,
              url: base64Data,
              file_id: att.id,
              isNew: true
            });
          } catch (error) {
            console.error('Failed to convert file:', error);
          }
        } else if (att.isExisting) {
          attachmentsToSubmit.push({
            name: att.name,
            type: att.type,
            size: att.size,
            url: isValidImageUrl(att.url) ? att.url : '',
            file_id: att.id,
            isExisting: true
          });
        }
      }
      
      const taskData = {
        ...formData,
        attachments: attachmentsToSubmit,
        links: formData.links.map(link => ({
          title: link.label || link.title || link.url || '',
          url: link.url || ''
        })),
        subtasks: formData.subtasks.map(sub => ({
          title: sub.title,
          completed: sub.completed || false
        }))
      };
      
      await taskAPI.update(editingTask._id, taskData);
      await fetchData();
      setShowEditModal(false);
      resetForm();
      setEditingTask(null);
    } catch (error) {
      console.error('Update error:', error);
      setError(error.response?.data?.error || 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'Todo',
      priority: 'Medium',
      due_date: '',
      estimated_hours: 0,
      assigned_to: '',
      assigned_to_name: '',
      attachments: [],
      links: [],
      labels: [],
      subtasks: []
    });
    setError('');
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'Todo',
      priority: task.priority || 'Medium',
      due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
      estimated_hours: task.estimated_hours || 0,
      assigned_to: task.assigned_to || '',
      assigned_to_name: task.assigned_to_name || '',
      attachments: (task.attachments || []).map(att => ({
        ...att,
        preview: null,
        file: null,
        isExisting: true,
        isNew: false,
        displayUrl: isValidImageUrl(att.url) ? att.url : PLACEHOLDER_IMAGE
      })),
      links: (task.links || []).map(link => {
        if (typeof link === 'string') {
          try {
            const parsed = JSON.parse(link);
            return { ...parsed, id: `link-${Date.now()}-${Math.random()}` };
          } catch {
            return { url: link, title: link, label: link, id: `link-${Date.now()}-${Math.random()}` };
          }
        }
        return { 
          ...link, 
          id: `link-${Date.now()}-${Math.random()}`,
          label: link.title || link.label || link.url || ''
        };
      }),
      labels: task.labels || [],
      subtasks: (task.subtasks || []).map(sub => ({
        ...sub,
        id: `subtask-${Date.now()}-${Math.random()}`
      }))
    });
    setSelectedStatus(task.status || 'Todo');
    setShowEditModal(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskAPI.delete(taskId);
      await fetchData();
    } catch (error) {
      setError('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateStatus(taskId, newStatus);
      await fetchData();
    } catch (error) {
      setError('Failed to update task status');
    }
  };

  const handleAssignMember = async (taskId, memberId) => {
    try {
      await taskAPI.assignMember(taskId, memberId);
      await fetchData();
    } catch (error) {
      setError('Failed to assign member');
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => {
      const isImage = file.type.startsWith('image/');
      let previewUrl = null;
      
      if (isImage) {
        previewUrl = createBlobUrl(file);
      }
      
      return {
        id: `file-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        file: file,
        preview: previewUrl,
        url: '',
        displayUrl: previewUrl || PLACEHOLDER_IMAGE,
        isNew: true,
        isExisting: false,
        isValid: true
      };
    });
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id) => {
    setFormData(prev => {
      const attachment = prev.attachments.find(att => att.id === id);
      if (attachment?.preview && attachment.preview.startsWith('blob:')) {
        revokeBlobUrl(attachment.preview);
      }
      return {
        ...prev,
        attachments: prev.attachments.filter(att => att.id !== id)
      };
    });
  };

  const openImagePreview = (url, name) => {
    setImagePreview({ url, name });
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    setShowImagePreview(false);
    setImagePreview(null);
  };

  const handleMembersUpdate = (updatedMembers) => {
    console.log('[Member Update] Updating members:', updatedMembers);
    setMembers(updatedMembers);
    
    if (project) {
      setProject({
        ...project,
        members: updatedMembers
      });
    }
  };

  // Filter tasks
  const getFilteredTasks = () => {
    let filtered = tasks;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }
    if (filterMember !== 'all') {
      filtered = filtered.filter(task => task.assigned_to === filterMember);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.assigned_to_name?.toLowerCase().includes(query)
      );
    }
    return filtered;
  };

  const getTasksByStatus = (status) => {
    return getFilteredTasks().filter(task => task.status === status);
  };

  const progress = project?.stats?.completion_rate || 0;

  // Render views
  const renderBoardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column);
        return (
          <div key={column} className="bg-[#FAF9F6] rounded-2xl p-4 min-h-[400px] border border-[#E7E5E0]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ 
                  backgroundColor: {
                    'Todo': '#8A8985',
                    'In Progress': '#3E3AA0',
                    'Review': '#C1741F',
                    'Done': '#12786B'
                  }[column] || '#8A8985'
                }} />
                <h3 className="font-semibold text-[#1B1B1E] pj-display text-sm">{column}</h3>
                <span className="px-2 py-0.5 bg-[#EEEEEC] rounded-full text-xs text-[#8A8985] pj-mono">
                  {columnTasks.length}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedStatus(column);
                  setFormData(prev => ({ ...prev, status: column }));
                  setShowCreateModal(true);
                }}
                className="p-1.5 text-[#8A8985] hover:text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
              >
                <FiPlus size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              {columnTasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  members={members}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onAssign={handleAssignMember}
                  onImagePreview={openImagePreview}
                />
              ))}
              
              {columnTasks.length === 0 && (
                <div className="text-center py-12 text-[#8A8985] text-sm border-2 border-dashed border-[#E7E5E0] rounded-xl">
                  <p className="pj-body">No tasks in {column}</p>
                  <button
                    onClick={() => {
                      setSelectedStatus(column);
                      setFormData(prev => ({ ...prev, status: column }));
                      setShowCreateModal(true);
                    }}
                    className="mt-2 text-[#3E3AA0] hover:text-[#33308A] text-xs font-medium pj-body"
                  >
                    + Add a task
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => {
    const filteredTasks = getFilteredTasks();
    return (
      <div className="space-y-3">
        {filteredTasks.map(task => (
          <TaskListItem
            key={task._id}
            task={task}
            members={members}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onAssign={handleAssignMember}
            onImagePreview={openImagePreview}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 pj-body">
        {DESIGN_FONTS}
        <LoadingSpinner />
        <p className="mt-4 text-[#5B5A56] text-sm">Loading tasks...</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="text-center py-12 pj-body">
        {DESIGN_FONTS}
        <p className="text-[#B23A48]">{error}</p>
        <button 
          onClick={() => navigate('/dashboard/projects')}
          className="mt-4 text-[#3E3AA0] hover:underline pj-body"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pj-body">
      {DESIGN_FONTS}

      <TaskHeader
        project={project}
        members={members}
        tasks={tasks}
        progress={progress}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onAddTask={() => {
          setSelectedStatus('Todo');
          setFormData(prev => ({ ...prev, status: 'Todo' }));
          setShowCreateModal(true);
        }}
        onBack={() => navigate('/dashboard/projects')}
        onMembersUpdate={handleMembersUpdate} 
      />

      {/* Generate Report Button - Added here */}
      <button
          onClick={() => setShowReportGenerator(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[#3E3AA0] bg-[#EDEBFB] hover:bg-[#D5D2F5] rounded-xl transition-colors"
        >
          <FiFileText size={18} />
          Generate Report
        </button>

        <button
          onClick={() => setShowWeeklyReport(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#1B4F72] hover:bg-[#1A3F5E] rounded-xl transition-colors"
        >
          <FiFileText size={18} />
          Weekly Report
        </button>

      <TaskFilters
        searchQuery={searchQuery}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        filterStatus={filterStatus}
        onFilterStatusChange={(e) => setFilterStatus(e.target.value)}
        filterPriority={filterPriority}
        onFilterPriorityChange={(e) => setFilterPriority(e.target.value)}
        filterMember={filterMember}
        onFilterMemberChange={(e) => setFilterMember(e.target.value)}
        members={members}
      />

      {error && (
        <div className="mb-4 p-4 bg-[#F7E6E8] border border-[#EAC3C8] rounded-xl flex items-center justify-between">
          <p className="text-sm text-[#B23A48] pj-body">{error}</p>
          <button onClick={() => setError('')} className="text-[#B23A48] hover:text-[#8A1F2A]">
            <FiX size={16} />
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#E7E5E0]">
          <div className="w-16 h-16 rounded-2xl bg-[#EDEBFB] text-[#3E3AA0] flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle size={28} />
          </div>
          <h3 className="pj-display text-lg font-semibold text-[#1B1B1E] mb-2">No tasks yet</h3>
          <p className="text-[#8A8985] mb-5 text-sm pj-body">Get started by creating your first task</p>
          <button
            onClick={() => {
              setSelectedStatus('Todo');
              setFormData(prev => ({ ...prev, status: 'Todo' }));
              setShowCreateModal(true);
            }}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] transition-colors"
          >
            <FiPlus className="mr-2" />
            Create Task
          </button>
        </div>
      ) : viewMode === 'board' ? (
        renderBoardView()
      ) : (
        renderListView()
      )}

      {/* Modals */}
      <TaskFormModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        onSubmit={handleCreate}
        isEdit={false}
        formData={formData}
        setFormData={setFormData}
        members={members}
        error={error}
        submitting={submitting}
        selectedStatus={selectedStatus}
        onFileUpload={handleFileUpload}
        onRemoveAttachment={handleRemoveAttachment}
        onImagePreview={openImagePreview}
      />

      <TaskFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setEditingTask(null);
        }}
        onSubmit={handleUpdate}
        isEdit={true}
        formData={formData}
        setFormData={setFormData}
        members={members}
        error={error}
        submitting={submitting}
        selectedStatus={selectedStatus}
        onFileUpload={handleFileUpload}
        onRemoveAttachment={handleRemoveAttachment}
        onImagePreview={openImagePreview}
      />

      {showReportGenerator && (
        <ReportGenerator
          projectId={projectId}
          projectName={project?.name}
          onClose={() => setShowReportGenerator(false)}
          onReportGenerated={handleReportGenerated}
        />
      )}



      {showWeeklyReport && (
        <WeeklyReportGenerator
          projectId={projectId}
          projectName={project?.name}
          onClose={() => setShowWeeklyReport(false)}
          onReportGenerated={(report) => {
            setCurrentReport(report);
            setShowReportViewer(true);
          }}
        />
      )}



      {showReportViewer && currentReport && (
        <ReportViewer
          reportId={currentReport._id}
          onClose={() => {
            setShowReportViewer(false);
            setCurrentReport(null);
          }}
        />
      )}

      {/* Image Preview */}
      {showImagePreview && imagePreview && (
        <div 
          className="fixed inset-0 bg-[#1B1B1E]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeImagePreview}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImagePreview}
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors z-10"
            >
              <FiX size={24} />
            </button>
            <div className="p-2">
              <img 
                src={imagePreview.url} 
                alt={imagePreview.name || 'Image preview'} 
                className="max-w-full max-h-[80vh] object-contain"
                onError={(e) => {
                  e.target.src = PLACEHOLDER_IMAGE;
                }}
              />
            </div>
            {imagePreview.name && (
              <div className="p-3 bg-white border-t border-[#E7E5E0]">
                <p className="text-sm text-[#5B5A56] pj-body truncate">{imagePreview.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskBoard;