// components/ProjectMembers.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI, userAPI } from '../services/api';
import {
  FiUsers,
  FiUserPlus,
  FiUserMinus,
  FiX,
  FiSearch,
  FiMail,
  FiUser,
  FiStar,
  FiCheck,
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiUserCheck,
  FiClock,
  FiShield,
  FiShieldOff
} from 'react-icons/fi';

const ProjectMembers = ({ projectId, projectName, onMemberChange }) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState(false);
  const [ownerId, setOwnerId] = useState(null);

  // Fetch members on component mount
  useEffect(() => {
    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log(`📊 Fetching members for project ${projectId}`);
      
      // Get project details first to get owner info
      const projectResponse = await projectAPI.getById(projectId);
      const projectData = projectResponse.data;
      setOwnerId(projectData.owner_id);
      
      // Get members - using the project's members array
      const membersData = projectData.members || [];
      
      // If members are just user IDs, fetch user details for each
      if (membersData.length > 0 && typeof membersData[0] === 'string') {
        const memberDetails = await Promise.all(
          membersData.map(async (userId) => {
            try {
              const userResponse = await userAPI.getById(userId);
              return userResponse.data;
            } catch (err) {
              console.error(`Failed to fetch user ${userId}:`, err);
              return { id: userId, name: 'Unknown User', email: '' };
            }
          })
        );
        setMembers(memberDetails);
        
        if (onMemberChange) {
          onMemberChange(memberDetails);
        }
      } else {
        // Members are already user objects
        setMembers(membersData);
        if (onMemberChange) {
          onMemberChange(membersData);
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch members:', error);
      setError('Failed to load project members');
      
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      console.log(`🔍 Searching users with query: ${query}`);
      
      const response = await userAPI.search(query);
      console.log('✅ Search results:', response.data);
      
      const users = response.data.users || [];
      // Filter out users already in the project
      const memberIds = members.map(m => m._id || m.id);
      const filteredUsers = users.filter(user => !memberIds.includes(user._id || user.id));
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('❌ Failed to search users:', error);
      setError('Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId) => {
    try {
      setAddingMember(true);
      setError('');
      console.log(`➕ Adding user ${userId} to project ${projectId}`);
      
      const response = await projectAPI.addMember(projectId, userId);
      console.log('✅ Member added:', response.data);
      
      // Refresh members list
      await fetchMembers();
      setShowAddModal(false);
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('❌ Failed to add member:', error);
      setError(error.response?.data?.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      return;
    }

    try {
      setRemovingMember(true);
      setError('');
      console.log(`➖ Removing user ${userId} from project ${projectId}`);
      
      const response = await projectAPI.removeMember(projectId, userId);
      console.log('✅ Member removed:', response.data);
      
      // Refresh members list
      await fetchMembers();
    } catch (error) {
      console.error('❌ Failed to remove member:', error);
      setError(error.response?.data?.error || 'Failed to remove member');
    } finally {
      setRemovingMember(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = ['#3E3AA0', '#12786B', '#B23A48', '#C1741F', '#6B4E9C', '#2E6B8F'];
    const sum = (name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchUsers(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3E3AA0]"></div>
        <p className="mt-4 text-[#5B5A56] text-sm">Loading members...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E7E5E0] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E7E5E0] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#EDEBFB] rounded-xl">
            <FiUsers className="text-[#3E3AA0]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#1B1B1E]">Team Members</h3>
            <p className="text-sm text-[#8A8985]">{members.length} members</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-[#3E3AA0] text-white rounded-xl hover:bg-[#33308A] transition-colors text-sm font-medium"
        >
          <FiUserPlus className="mr-2" size={16} />
          Add Member
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-[#F7E6E8] border border-[#EAC3C8] rounded-lg">
          <p className="text-sm text-[#B23A48]">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-xs text-[#98303C] hover:text-[#7A2731] underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Members List */}
      <div className="divide-y divide-[#EFEDE8]">
        {members.length === 0 ? (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#EDEBFB] text-[#3E3AA0] flex items-center justify-center mx-auto mb-4">
              <FiUsers size={28} />
            </div>
            <h4 className="text-lg font-semibold text-[#1B1B1E] mb-2">No members yet</h4>
            <p className="text-[#8A8985] text-sm mb-4">
              Add team members to collaborate on this project
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-[#3E3AA0] text-white rounded-xl hover:bg-[#33308A] transition-colors text-sm"
            >
              <FiUserPlus className="mr-2" />
              Add First Member
            </button>
          </div>
        ) : (
          members.map((member) => {
            const userId = member._id || member.id;
            const userName = member.name || 'Unknown';
            const userEmail = member.email || '';
            const isOwner = userId === ownerId;

            return (
              <div key={userId} className="px-6 py-4 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors group">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(userName) }}
                  >
                    {getInitials(userName)}
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[#1B1B1E] truncate">
                        {userName}
                      </span>
                      {isOwner && (
                        <span className="px-2 py-0.5 bg-[#EDEBFB] text-[#3E3AA0] text-xs rounded-full flex items-center gap-1 whitespace-nowrap">
                          <FiStar size={12} />
                          Owner
                        </span>
                      )}
                      {member.role && !isOwner && (
                        <span className="px-2 py-0.5 bg-[#E4F2EE] text-[#12786B] text-xs rounded-full flex items-center gap-1 whitespace-nowrap">
                          <FiShield size={12} />
                          {member.role}
                        </span>
                      )}
                    </div>
                    {userEmail && (
                      <p className="text-sm text-[#8A8985] truncate flex items-center gap-1">
                        <FiMail size={12} />
                        {userEmail}
                      </p>
                    )}
                    {member.joined_at && (
                      <p className="text-xs text-[#8A8985] flex items-center gap-1">
                        <FiClock size={10} />
                        Joined {formatDate(member.joined_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Remove Button */}
                {!isOwner && (
                  <button
                    onClick={() => handleRemoveMember(userId, userName)}
                    disabled={removingMember}
                    className="p-2 text-[#B23A48] hover:bg-[#F7E6E8] rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                    title="Remove member"
                  >
                    <FiTrash2 size={16} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1B1B1E]/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowAddModal(false);
                setSearchTerm('');
                setSearchResults([]);
                setError('');
              }}
              className="absolute top-4 right-4 text-[#8A8985] hover:text-[#1B1B1E] transition-colors"
            >
              <FiX size={22} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-[#EDEBFB] rounded-xl">
                <FiUserPlus className="text-[#3E3AA0]" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#1B1B1E]">Add Member</h3>
                <p className="text-sm text-[#8A8985]">
                  Search for users to add to "{projectName || 'project'}"
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8A8985]" />
              <input
                type="text"
                placeholder="Search by name or email (min 2 characters)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!e.target.value.trim()) {
                    setSearchResults([]);
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E7E5E0] rounded-xl focus:ring-2 focus:ring-[#3E3AA0]/30 focus:border-[#3E3AA0] outline-none transition-all"
              />
            </div>

            {/* Search Results */}
            {searching ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3E3AA0]"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-80 overflow-y-auto space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user._id || user.id}
                    className="flex items-center justify-between p-3 bg-[#FAF9F6] rounded-xl hover:bg-[#EDEBFB] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: getAvatarColor(user.name) }}
                      >
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-[#1B1B1E]">{user.name}</p>
                        <p className="text-xs text-[#8A8985]">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user._id || user.id)}
                      disabled={addingMember}
                      className="px-4 py-1.5 bg-[#3E3AA0] text-white rounded-lg hover:bg-[#33308A] transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
                    >
                      <FiPlus size={14} />
                      Add
                    </button>
                  </div>
                ))}
              </div>
            ) : searchTerm && !searching && searchTerm.length >= 2 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[#F2F1ED] flex items-center justify-center mx-auto mb-3">
                  <FiAlertCircle className="text-[#8A8985]" size={24} />
                </div>
                <p className="text-[#5B5A56] text-sm">No users found</p>
                <p className="text-[#8A8985] text-xs">
                  Try a different search term
                </p>
              </div>
            ) : searchTerm && searchTerm.length < 2 ? (
              <div className="text-center py-8 text-[#8A8985] text-sm">
                <FiSearch className="mx-auto mb-2" size={24} />
                <p>Type at least 2 characters to search</p>
              </div>
            ) : (
              <div className="text-center py-8 text-[#8A8985] text-sm">
                <FiSearch className="mx-auto mb-2" size={24} />
                <p>Search for users to add to your project</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-[#EFEDE8] flex justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchTerm('');
                  setSearchResults([]);
                  setError('');
                }}
                className="px-4 py-2 text-sm font-medium text-[#5B5A56] bg-[#F2F1ED] hover:bg-[#E7E5E0] rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMembers;