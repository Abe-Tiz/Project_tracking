import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiLogOut, 
  FiUsers, 
  FiFolder, 
  FiCheckSquare,
  FiMenu,
  FiX,
  FiUser,
  FiBell,
  FiSettings,
  FiSearch,
  FiHelpCircle,
  FiGrid,
  FiCalendar,
  FiBarChart2,
  FiUserCheck,
  FiActivity,
  FiChevronDown,
  FiLogIn,
  FiAlertCircle,
  FiCheck,
  FiXCircle,
  FiMessageCircle
} from 'react-icons/fi';
import LogoutModal from '../components/LogoutModal';

// ============ SIDEBAR COMPONENT ============
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: FiHome, label: 'Dashboard', path: '/dashboard' },
    { icon: FiGrid, label: 'Projects', path: '/dashboard/projects' },
    { icon: FiCheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
    { icon: FiUsers, label: 'Team', path: '/dashboard/users' },
    { icon: FiBarChart2, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: FiCalendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: FiSettings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Keyboard shortcut for logout
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'q') {
        e.preventDefault();
        setShowLogoutModal(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white w-72 z-30
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="font-bold text-white text-xl">P</span>
            </div>
            <div>
              <span className="font-bold text-xl">ProjectHub</span>
              <span className="block text-xs text-gray-400">v2.0.0</span>
            </div>
          </div>
          <button 
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* User Profile Section */}
        <div className="px-4 py-4 border-b border-gray-700/50">
          <div className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
            <FiChevronDown className="text-gray-400" size={16} />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">Main Menu</p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                  ${isActive(item.path) 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }
                `}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
                {isActive(item.path) && (
                  <span className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></span>
                )}
              </Link>
            ))}
          </nav>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mt-6 mb-3">Support</p>
          <nav className="space-y-1">
            <Link
              to="/dashboard/help"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 rounded-xl hover:bg-gray-700/50 hover:text-white transition-all duration-200"
            >
              <FiHelpCircle className="mr-3 h-5 w-5" />
              Help & Support
            </Link>
          </nav>
        </div>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-700/50">
          <button
            onClick={handleLogoutClick}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors mr-3">
              <FiLogOut className="h-5 w-5 text-red-400" />
            </div>
            <span>Logout</span>
            <span className="ml-auto text-xs text-gray-500">Ctrl + Q</span>
          </button>
          <p className="text-xs text-center text-gray-500 mt-3">
            © 2024 ProjectHub. All rights reserved.
          </p>
        </div>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

// ============ HEADER COMPONENT ============
const Header = ({ setIsSidebarOpen }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Overview';
    const segments = path.split('/');
    const last = segments[segments.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
  };

  const notificationsList = [
    {
      id: 1,
      title: 'New task assigned',
      description: 'Design homepage mockup',
      time: '2 minutes ago',
      type: 'task',
      read: false
    },
    {
      id: 2,
      title: 'Project updated',
      description: 'Website Redesign progress',
      time: '1 hour ago',
      type: 'project',
      read: false
    },
    {
      id: 3,
      title: 'New comment',
      description: 'John commented on Task #123',
      time: '3 hours ago',
      type: 'comment',
      read: true
    }
  ];

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-gray-200/50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <FiMenu size={22} />
            </button>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-xs text-gray-500">Welcome back, {user?.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="hidden md:flex items-center bg-gray-100 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
              <FiSearch className="text-gray-400 mr-2" size={18} />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="bg-transparent outline-none text-sm text-gray-700 w-48"
              />
              <kbd className="ml-2 text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded">⌘K</kbd>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <FiBell size={20} />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsList.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                          !notification.read ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${
                            notification.type === 'task' ? 'bg-purple-100 text-purple-600' :
                            notification.type === 'project' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {notification.type === 'task' ? <FiCheckSquare size={16} /> :
                             notification.type === 'project' ? <FiFolder size={16} /> :
                             <FiMessageCircle size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{notification.description}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-xl transition-colors"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <FiChevronDown className="text-gray-400" size={16} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {user?.role || 'Team Member'}
                    </span>
                  </div>
                  <div className="py-1">
                    <Link to="/dashboard/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <FiUser className="mr-3" size={16} />
                      My Profile
                    </Link>
                    <Link to="/dashboard/settings" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <FiSettings className="mr-3" size={16} />
                      Settings
                    </Link>
                    <Link to="/dashboard/help" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <FiHelpCircle className="mr-3" size={16} />
                      Help & Support
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 pt-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        // Trigger logout from sidebar
                        const logoutEvent = new CustomEvent('logoutRequested');
                        window.dispatchEvent(logoutEvent);
                      }}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <FiLogOut className="mr-3" size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ============ MAIN DASHBOARD ============
const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Listen for logout events from header
  useEffect(() => {
    const handleLogoutEvent = () => {
      setShowLogoutModal(true);
    };

    window.addEventListener('logoutRequested', handleLogoutEvent);
    return () => window.removeEventListener('logoutRequested', handleLogoutEvent);
  }, []);

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header setIsSidebarOpen={setIsSidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
};

export default Dashboard;