import React, { useState, useRef, useCallback } from 'react';
import { FiUser, FiTag, FiCheckCircle, FiLink, FiPaperclip, FiImage, FiPlus, FiX, FiSave } from 'react-icons/fi';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { LabelList } from '../common/LabelList';
import { LinkList } from '../common/LinkList';
import { SubtaskList } from '../common/SubtaskList';
import { AttachmentList } from '../common/AttachmentList';

const AVAILABLE_LABELS = [
  { name: 'Bug', color: '#B23A48' },
  { name: 'Feature', color: '#3E3AA0' },
  { name: 'Enhancement', color: '#12786B' },
  { name: 'Documentation', color: '#C1741F' },
  { name: 'Design', color: '#6B4E9C' },
  { name: 'Testing', color: '#2E6B8F' },
  { name: 'UI/UX', color: '#B23A48' },
  { name: 'Backend', color: '#3E3AA0' },
  { name: 'Frontend', color: '#12786B' },
  { name: 'API', color: '#6B4E9C' },
  { name: 'Database', color: '#2E6B8F' },
  { name: 'DevOps', color: '#C1741F' },
  { name: 'Security', color: '#B23A48' }
];

const STATUS_OPTIONS = [
  { value: 'Todo', label: 'Todo' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Review', label: 'Review' },
  { value: 'Done', label: 'Done' }
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' }
];

export const TaskFormModal = React.memo(({
  isOpen,
  onClose,
  onSubmit,
  isEdit = false,
  formData,
  setFormData,
  members,
  error,
  submitting,
  selectedStatus,
  onFileUpload,
  onRemoveAttachment,
  onImagePreview
}) => {
  const [linkInput, setLinkInput] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const fileInputRef = useRef(null);

  const safeMembers = Array.isArray(members) ? members.filter(m => m && m._id && m.name) : [];
  
  const availableLabels = AVAILABLE_LABELS.filter(label => 
    !formData.labels.some(l => {
      const labelName = typeof l === 'string' ? l : l?.name;
      return labelName === label.name;
    })
  );

  // Form field handlers
  const handleTitleChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, title: e.target.value }));
  }, [setFormData]);

  const handleDescriptionChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  }, [setFormData]);

  const handleFormStatusChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, status: e.target.value }));
  }, [setFormData]);

  const handlePriorityChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, priority: e.target.value }));
  }, [setFormData]);

  const handleDueDateChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, due_date: e.target.value }));
  }, [setFormData]);

  const handleHoursChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }));
  }, [setFormData]);

  const handleAssignedToChange = useCallback((e) => {
    const member = safeMembers.find(m => m._id === e.target.value);
    setFormData(prev => ({
      ...prev,
      assigned_to: e.target.value,
      assigned_to_name: member?.name || ''
    }));
  }, [safeMembers, setFormData]);

  const handleAddLabel = useCallback(() => {
    if (labelInput) {
      const label = AVAILABLE_LABELS.find(l => l.name === labelInput);
      if (label && !formData.labels.some(l => (typeof l === 'string' ? l : l?.name) === labelInput)) {
        setFormData(prev => ({
          ...prev,
          labels: [...prev.labels, label]
        }));
        setLabelInput('');
      }
    }
  }, [labelInput, formData.labels, setFormData]);

  const handleRemoveLabel = useCallback((name) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => (typeof label === 'string' ? label : label?.name) !== name)
    }));
  }, [setFormData]);

  const handleAddSubtask = useCallback(() => {
    if (subtaskInput.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, {
          id: `subtask-${Date.now()}-${Math.random()}`,
          title: subtaskInput.trim(),
          completed: false
        }]
      }));
      setSubtaskInput('');
    }
  }, [subtaskInput, setFormData]);

  const handleToggleSubtask = useCallback((id) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(subtask =>
        subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask
      )
    }));
  }, [setFormData]);

  const handleRemoveSubtask = useCallback((id) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(subtask => subtask.id !== id)
    }));
  }, [setFormData]);

  const handleAddLink = useCallback(() => {
    if (!linkInput.trim()) return;
    let url = linkInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, {
        id: `link-${Date.now()}-${Math.random()}`,
        url: url,
        label: linkLabel.trim() || linkInput.trim(),
        title: linkLabel.trim() || linkInput.trim()
      }]
    }));
    setLinkInput('');
    setLinkLabel('');
    setShowLinkInput(false);
  }, [linkInput, linkLabel, setFormData]);

  const handleRemoveLink = useCallback((id) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter(link => link.id !== id)
    }));
  }, [setFormData]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Task' : 'Create New Task'}
      subtitle={isEdit ? 'Update task details' : `in ${selectedStatus}`}
    >
      {error && (
        <div className="mb-4 p-3 bg-[#F7E6E8] border border-[#EAC3C8] rounded-lg">
          <p className="text-sm text-[#B23A48] pj-body">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Task Title */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body">Task Title *</label>
          <Input
            type="text"
            required
            value={formData.title}
            onChange={handleTitleChange}
            placeholder="Enter task title"
          />
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body">Description</label>
          <Textarea
            rows="2"
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Describe the task"
          />
        </div>

        {/* Assign Member */}
        {safeMembers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
              <FiUser className="inline mr-1" size={14} />
              Assign to
            </label>
            <Select
              value={formData.assigned_to || ''}
              onChange={handleAssignedToChange}
              options={[
                { value: '', label: 'Unassigned' },
                ...safeMembers.map(m => ({ 
                  value: m._id, 
                  label: `${m.name} ${m.email ? `(${m.email})` : ''}` 
                }))
              ]}
            />
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">Status</label>
          <Select
            value={formData.status}
            onChange={handleFormStatusChange}
            options={STATUS_OPTIONS}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body">Priority</label>
          <Select
            value={formData.priority}
            onChange={handlePriorityChange}
            options={PRIORITY_OPTIONS}
          />
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body">Estimated Hours</label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={formData.estimated_hours}
            onChange={handleHoursChange}
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body">Due Date</label>
          <Input
            type="date"
            value={formData.due_date}
            onChange={handleDueDateChange}
          />
        </div>

        {/* Labels Section */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
            <FiTag className="inline mr-1" size={14} />
            Labels
          </label>
          <LabelList 
            labels={formData.labels} 
            onRemove={handleRemoveLabel}
          />
          <div className="flex gap-2 mt-2">
            <Select
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              options={[
                { value: '', label: 'Add label...' },
                ...availableLabels.map(l => ({ value: l.name, label: l.name }))
              ]}
              className="flex-1"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAddLabel}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Subtasks Section */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
            <FiCheckCircle className="inline mr-1" size={14} />
            Subtasks
          </label>
          <SubtaskList
            subtasks={formData.subtasks}
            onToggle={handleToggleSubtask}
            onRemove={handleRemoveSubtask}
          />
          <div className="flex gap-2 mt-2">
            <Input
              type="text"
              value={subtaskInput}
              onChange={(e) => setSubtaskInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add subtask..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="success"
              size="sm"
              onClick={handleAddSubtask}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Links Section */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
            <FiLink className="inline mr-1" size={14} />
            Links
          </label>
          
          <div className="flex items-center gap-2 mb-3">
            <Button
              type="button"
              variant="warning"
              size="sm"
              onClick={() => setShowLinkInput(!showLinkInput)}
              icon={FiPlus}
            >
              Add Link
            </Button>
          </div>

          {showLinkInput && (
            <div className="mb-3 p-3 bg-[#FAF9F6] rounded-xl border border-[#E7E5E0]">
              <div className="space-y-2">
                <Input
                  type="text"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="Enter URL (e.g., example.com)"
                />
                <Input
                  type="text"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="Link label (optional)"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddLink}
                    icon={FiPlus}
                  >
                    Add Link
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowLinkInput(false);
                      setLinkInput('');
                      setLinkLabel('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          <LinkList
            links={formData.links}
            onRemove={handleRemoveLink}
          />
        </div>

        {/* Attachments Section */}
        <div>
          <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
            <FiPaperclip className="inline mr-1" size={14} />
            Attachments
          </label>
          
          <div className="flex items-center gap-2 mb-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              icon={FiImage}
            >
              Upload File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileUpload}
              multiple
              className="hidden"
            />
          </div>

          <AttachmentList
            attachments={formData.attachments}
            onRemove={onRemoveAttachment}
            onPreview={onImagePreview}
          />
        </div>
        
        {/* Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-[#EFEDE8]">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            icon={FiSave}
          >
            {isEdit ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
});











