// src/components/tasks/MemberManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiUsers, FiX, FiUserPlus, FiTrash2, FiSearch, 
  FiUser, FiMail, FiCheck, FiEdit2, FiBriefcase,
  FiPhone, FiMapPin, FiSave, FiPlus, FiAlertCircle,
  FiUserCheck
} from 'react-icons/fi';
import { projectAPI, userAPI } from '../../services/api';

export const MemberManagement = React.memo(({ 
  projectId, 
  members, 
  onMembersUpdate,
  isProjectOwner = true 
}) => {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  // Form state for adding/editing members
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: 'Team Member',
    phone: '',
    location: '',
    title: '',
    skills: [],
    joinDate: new Date().toISOString().split('T')[0]
  });
  
  const [skillInput, setSkillInput] = useState('');

  // Available roles
  const availableRoles = [
    'Project Owner',
    'Project Manager', 
    'Team Lead',
    'Senior Developer',
    'Developer',
    'Designer',
    'QA Engineer',
    'DevOps Engineer',
    'Business Analyst',
    'Stakeholder',
    'Team Member',
    'Guest'
  ];

  // Departments
  const departments = [
    'Card Channel',
    'ACI',
    'Fraude and Complience',
    'DataBase ',
    'Cloud and Core',
    'Cyber Security',
    'Network Administration'
  ];

  // Filter members based on search
  const filteredMembers = members.filter(member => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      member.name?.toLowerCase().includes(search) ||
      member.email?.toLowerCase().includes(search) ||
      member.department?.toLowerCase().includes(search) ||
      member.role?.toLowerCase().includes(search) ||
      member.title?.toLowerCase().includes(search)
    );
  });

  // Search for existing users
  const searchUsers = async () => {
    if (!searchTerm.trim()) {
      setAvailableUsers([]);
      return;
    }
    
    try {
      setSearchingUsers(true);
      const response = await userAPI.getAll(1, 20, searchTerm);
      const users = response.data.users || [];
      
      // Filter out users already in the project
      const memberIds = new Set(members.map(m => m._id));
      const available = users.filter(user => !memberIds.has(user._id));
      setAvailableUsers(available);
    } catch (error) {
      console.error('Failed to search users:', error);
      setAvailableUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle skill management
  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      department: '',
      role: 'Team Member',
      phone: '',
      location: '',
      title: '',
      skills: [],
      joinDate: new Date().toISOString().split('T')[0]
    });
    setSkillInput('');
    setEditingMember(null);
    setError('');
    setAvailableUsers([]);
    setShowUserSearch(false);
  };

  // Open add member form
  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
    setShowUserSearch(true);
    setAvailableUsers([]);
  };

  // Open edit member form
  const openEditForm = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      email: member.email || '',
      department: member.department || '',
      role: member.role || 'Team Member',
      phone: member.phone || '',
      location: member.location || '',
      title: member.title || '',
      skills: member.skills || [],
      joinDate: member.joinDate || new Date().toISOString().split('T')[0]
    });
    setShowAddForm(true);
    setShowUserSearch(false);
  };

  // Close add/edit form
  const closeForm = () => {
    setShowAddForm(false);
    resetForm();
  };

  // Handle adding existing user
  const handleAddExistingUser = async (user) => {
    try {
      setLoading(true);
      setError('');
      
      // Send as object with user_id property
      const response = await projectAPI.addMember(projectId, { user_id: user._id });
      
      const newMember = response.data.member || {
        _id: user._id,
        name: user.name || user.full_name || user.username || 'Unknown',
        email: user.email || '',
        role: 'Team Member',
        department: user.department || '',
        title: user.title || '',
        phone: user.phone || '',
        location: user.location || '',
        skills: user.skills || [],
        joinDate: new Date().toISOString().split('T')[0],
        is_external: false
      };
      
      const updatedMembers = [...members, newMember];
      onMembersUpdate(updatedMembers);
      
      setSuccess(`${newMember.name} added to project successfully!`);
      setAvailableUsers(prev => prev.filter(u => u._id !== user._id));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to add user:', error);
      setError(error.response?.data?.error || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding external member
  const handleAddExternalMember = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // IMPORTANT: Do NOT include user_id for external members
      const memberData = {
        name: formData.name,
        email: formData.email,
        department: formData.department || '',
        role: formData.role || 'Team Member',
        phone: formData.phone || '',
        location: formData.location || '',
        title: formData.title || '',
        skills: formData.skills || [],
        join_date: formData.joinDate || new Date().toISOString().split('T')[0]
      };

      console.log('Adding external member with data:', memberData);

      let updatedMembers;
      
      if (editingMember) {
        // Update existing member via API
        await projectAPI.updateMember(projectId, editingMember._id, memberData);
        updatedMembers = members.map(m => 
          m._id === editingMember._id ? { ...m, ...memberData } : m
        );
        setSuccess('Member updated successfully!');
      } else {
        // Add new external member - send the data directly
        const response = await projectAPI.addMember(projectId, memberData);
        const newMember = response.data.member || {
          ...memberData,
          _id: `member_${Date.now()}`
        };
        updatedMembers = [...members, newMember];
        setSuccess('Member added successfully!');
      }
      
      onMembersUpdate(updatedMembers);
      closeForm();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to save member:', error);
      setError(error.response?.data?.error || 'Failed to save member');
    } finally {
      setLoading(false);
    }
  };

  // Handle removing a member
  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove "${memberName}" from this project?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await projectAPI.removeMember(projectId, memberId);
      
      const updatedMembers = members.filter(m => m._id !== memberId);
      onMembersUpdate(updatedMembers);
      setSuccess('Member removed successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to remove member:', error);
      setError(error.response?.data?.error || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };




  // Get role badge color
  const getRoleColor = (role) => {
    const colors = {
      'Project Owner': 'bg-purple-100 text-purple-700',
      'Project Manager': 'bg-blue-100 text-blue-700',
      'Team Lead': 'bg-indigo-100 text-indigo-700',
      'Senior Developer': 'bg-cyan-100 text-cyan-700',
      'Developer': 'bg-emerald-100 text-emerald-700',
      'Designer': 'bg-pink-100 text-pink-700',
      'QA Engineer': 'bg-orange-100 text-orange-700',
      'DevOps Engineer': 'bg-red-100 text-red-700',
      'Business Analyst': 'bg-yellow-100 text-yellow-700',
      'Stakeholder': 'bg-gray-100 text-gray-700',
      'Team Member': 'bg-green-100 text-green-700',
      'Guest': 'bg-gray-100 text-gray-500'
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  // Get department color
  const getDepartmentColor = (department) => {
    const colors = {
      'Card Channel': 'bg-blue-50 text-blue-600',
      'ACI': 'bg-pink-50 text-pink-600',
      'Fraude and Complience': 'bg-purple-50 text-purple-600',
      'DataBase': 'bg-orange-50 text-orange-600',
      'Cloud and Core': 'bg-red-50 text-red-600',
      'Cyber Security': 'bg-emerald-50 text-emerald-600',
      'Network Administration': 'bg-rose-50 text-rose-600',
    };
    return colors[department] || 'bg-gray-50 text-gray-600';
  };

  return (
    <>
      {/* Member Management Button */}
      <button
        onClick={() => setShowMemberModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] rounded-xl transition-colors shadow-sm"
      >
        <FiUsers size={18} />
        Manage Members
        {members.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
            {members.length}
          </span>
        )}
      </button>

      {/* Member Management Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="pj-display text-xl font-semibold text-[#1B1B1E]">
                  Project Members
                </h3>
                <p className="text-sm text-[#8A8985] mt-1 pj-body">
                  Manage team members and their roles
                </p>
              </div>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  closeForm();
                }}
                className="p-2 text-[#8A8985] hover:text-[#1B1B1E] hover:bg-[#F2F1ED] rounded-lg transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#F7E6E8] border border-[#EAC3C8] rounded-lg flex items-center gap-2">
                <FiAlertCircle className="text-[#B23A48]" size={16} />
                <p className="text-sm text-[#B23A48] pj-body">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-[#E4F2EE] border border-[#B8D5CC] rounded-lg flex items-center gap-2">
                <FiCheck className="text-[#12786B]" size={16} />
                <p className="text-sm text-[#12786B] pj-body">{success}</p>
              </div>
            )}

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A8985]" size={16} />
                <input
                  type="text"
                  placeholder="Search members by name, email, department, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E7E5E0] focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                />
              </div>
              
              <button
                onClick={openAddForm}
                className="px-4 py-2.5 text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <FiUserPlus size={16} />
                Add Member
              </button>
            </div>

            {/* Member List */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#EDEBFB] flex items-center justify-center mx-auto mb-4">
                    <FiUsers size={24} className="text-[#3E3AA0]" />
                  </div>
                  <h4 className="text-[#1B1B1E] font-medium mb-1">No members found</h4>
                  <p className="text-[#8A8985] text-sm">
                    {searchTerm ? 'Try adjusting your search' : 'Click "Add Member" to get started'}
                  </p>
                </div>
              ) : (
                filteredMembers.map((member) => (
                  <div
                    key={member._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#FAF9F6] rounded-xl border border-[#E7E5E0] hover:border-[#3E3AA0]/20 transition-all group"
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: getAvatarColor(member.name) }}
                      >
                        {getInitials(member.name)}
                      </div>
                      
                      {/* Member Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-medium text-[#1B1B1E] text-sm">
                            {member.name}
                          </h4>
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                          {member.is_external && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1">
                              <FiUserPlus size={10} />
                              External
                            </span>
                          )}
                          {member.isNew && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-600 rounded-full">
                              New
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#8A8985] mt-1">
                          <span className="flex items-center gap-1">
                            <FiMail size={12} />
                            {member.email}
                          </span>
                          {member.department && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${getDepartmentColor(member.department)}`}>
                              <FiBriefcase size={12} />
                              {member.department}
                            </span>
                          )}
                          {member.phone && (
                            <span className="flex items-center gap-1">
                              <FiPhone size={12} />
                              {member.phone}
                            </span>
                          )}
                          {member.title && (
                            <span className="flex items-center gap-1">
                              {member.title}
                            </span>
                          )}
                        </div>
                        
                        {member.skills && member.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {member.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] bg-[#EDEBFB] text-[#3E3AA0] rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
                      {member.is_external && (
                        <button
                          onClick={() => openEditForm(member)}
                          className="p-2 text-[#8A8985] hover:text-[#3E3AA0] hover:bg-[#EDEBFB] rounded-lg transition-colors"
                          title="Edit member"
                        >
                          <FiEdit2 size={16} />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleRemoveMember(member._id, member.name)}
                        className="p-2 text-[#B23A48] hover:bg-[#F7E6E8] rounded-lg transition-colors"
                        title="Remove member"
                        disabled={loading}
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#EFEDE8]">
              <span className="text-sm text-[#8A8985] pj-mono">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => {
                  setShowMemberModal(false);
                  closeForm();
                }}
                className="px-4 py-2 text-sm font-medium text-[#5B5A56] bg-[#F2F1ED] hover:bg-[#E7E5E0] rounded-xl transition-colors pj-body"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Member Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm overflow-y-auto h-full w-full z-[60] flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeForm}
              className="absolute top-4 right-4 text-[#8A8985] hover:text-[#1B1B1E] transition-colors z-10"
            >
              <FiX size={22} />
            </button>

            <h3 className="pj-display text-xl font-semibold text-[#1B1B1E] mb-2">
              {editingMember ? 'Edit Member' : 'Add New Member'}
            </h3>
            <p className="text-sm text-[#8A8985] mb-6 pj-body">
              {editingMember 
                ? 'Update external member details' 
                : 'Add a new team member to the project'}
            </p>

            {/* Search for existing users - Only show when adding new member */}
            {!editingMember && showUserSearch && (
              <div className="mb-6">
                <h4 className="font-medium text-[#1B1B1E] text-sm mb-3 pj-display">
                  Search for existing user
                </h4>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A8985]" size={16} />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#E7E5E0] focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                    />
                  </div>
                  <button
                    onClick={searchUsers}
                    disabled={searchingUsers}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] rounded-xl transition-colors disabled:opacity-50"
                  >
                    {searchingUsers ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {availableUsers.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-4">
                    {availableUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E7E5E0] hover:border-[#3E3AA0]/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                            style={{ backgroundColor: getAvatarColor(user.name) }}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1B1B1E] truncate">
                              {user.name || user.full_name || user.username}
                            </p>
                            <p className="text-xs text-[#8A8985] truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddExistingUser(user)}
                          disabled={loading}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-[#12786B] hover:bg-[#0F5F54] rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <FiUserCheck size={14} />
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserSearch(false);
                    }}
                    className="text-[#3E3AA0] hover:text-[#33308A] text-sm font-medium pj-body"
                  >
                    + Add as external member (not in system)
                  </button>
                </div>
              </div>
            )}

            {/* External Member Form */}
            {(!showUserSearch || editingMember) && (
              <form onSubmit={handleAddExternalMember} className="space-y-4">
                {/* Name and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5B5A56] pj-body">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5B5A56] pj-body">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Department and Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5B5A56] pj-body">
                      Department
                    </label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                    >
                      <option value="">Select department...</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5B5A56] pj-body">
                      Role
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Title and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5B5A56] pj-body">
                      Job Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                      placeholder="Senior Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5B5A56] pj-body">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Location and Join Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#5B5A56] pj-body">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                      placeholder="New York, NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#5B5A56] pj-body">
                      Join Date
                    </label>
                    <input
                      type="date"
                      name="joinDate"
                      value={formData.joinDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-[#5B5A56] pj-body mb-2">
                    Skills
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      className="flex-1 rounded-xl border border-[#E7E5E0] shadow-sm px-3 py-2.5 focus:border-[#3E3AA0] focus:ring-2 focus:ring-[#3E3AA0]/20 outline-none pj-body text-sm"
                      placeholder="Add a skill (e.g., React, Python)"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2.5 text-sm font-medium text-white bg-[#12786B] hover:bg-[#0F5F54] rounded-xl transition-colors whitespace-nowrap"
                    >
                      <FiPlus size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#EDEBFB] text-[#3E3AA0] rounded-lg text-sm"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 hover:text-[#B23A48]"
                        >
                          <FiX size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-[#EFEDE8]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingMember) {
                        setShowUserSearch(true);
                      } else {
                        closeForm();
                      }
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-[#5B5A56] bg-[#F2F1ED] hover:bg-[#E7E5E0] rounded-xl transition-colors pj-body"
                  >
                    {editingMember ? 'Cancel' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#3E3AA0] hover:bg-[#33308A] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 pj-body"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {editingMember ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        {editingMember ? 'Update Member' : 'Add Member'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
});

// Helper functions
const getAvatarColor = (name = '') => {
  const AVATAR_PALETTE = ['#3E3AA0', '#12786B', '#B23A48', '#C1741F', '#6B4E9C', '#2E6B8F', '#B23A48', '#3E3AA0'];
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
};

const getInitials = (name = '') => {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};