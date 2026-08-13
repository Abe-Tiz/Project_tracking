// import React, { createContext, useState, useContext, useEffect } from 'react';
// import { authAPI } from '../services/api';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // Check if user is logged in on mount
//     const token = localStorage.getItem('access_token');
//     const storedUser = localStorage.getItem('user');
    
//     if (token && storedUser) {
//       try {
//         const userData = JSON.parse(storedUser);
//         setUser(userData);
//         console.log('👤 User restored from localStorage:', userData);
//       } catch (e) {
//         console.error('❌ Failed to parse user data:', e);
//         localStorage.removeItem('user');
//       }
//     }
//     setLoading(false);
//   }, []);

//   const login = async (userData) => {
//     console.log('🔐 Login called with user data:', userData);
//     try {
//       setUser(userData);
//       setError(null);
//       console.log('✅ User set in context');
//       return { success: true, user: userData };
//     } catch (error) {
//       console.error('❌ Login error:', error);
//       setError(error.message);
//       return { success: false, error: error.message };
//     }
//   };

//   const logout = async () => {
//     console.log('🚪 Logout called');
//     try {
//       await authAPI.logout();
//     } catch (error) {
//       console.warn('⚠️ Logout API call failed:', error);
//     } finally {
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('user');
//       setUser(null);
//       console.log('✅ User logged out');
//     }
//   };

//  const updateProfile = async (data) => {
//   console.log('🔄 Updating profile with data:', data);
//   try {
//     const response = await authAPI.updateProfile(data);
//     console.log('✅ Profile updated:', response.data);
    
//     // Check if user data is returned in the response
//     let updatedUser;
//     if (response.data.user) {
//       // Use the user data from response
//       updatedUser = { ...user, ...response.data.user };
//     } else {
//       // If no user data in response, fetch fresh user data
//       console.log('🔄 Fetching fresh user data...');
//       const profileResponse = await authAPI.getProfile();
//       updatedUser = { ...user, ...profileResponse.data.user };
//     }
    
//     // Update user in state and localStorage
//     setUser(updatedUser);
//     localStorage.setItem('user', JSON.stringify(updatedUser));
    
//     return { 
//       success: true, 
//       user: updatedUser,
//       message: response.data.message || 'Profile updated successfully'
//     };
//   } catch (error) {
//     console.error('❌ Profile update failed:', error);
//     return { 
//       success: false, 
//       error: error.response?.data?.error || 'Failed to update profile' 
//     };
//   }
// };

//   const changePassword = async (currentPassword, newPassword) => {
//     console.log('🔑 Changing password');
//     try {
//       const response = await authAPI.changePassword({
//         current_password: currentPassword,
//         new_password: newPassword
//       });
//       console.log('✅ Password changed successfully');
//       return { success: true, message: 'Password changed successfully' };
//     } catch (error) {
//       console.error('❌ Password change failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to change password' 
//       };
//     }
//   };

//   const deleteAccount = async () => {
//     console.log('🗑️ Deleting user account');
//     try {
//       const response = await authAPI.deleteAccount();
//       console.log('✅ Account deleted:', response.data);
      
//       // Clear all user data
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('user');
//       setUser(null);
      
//       return { success: true, message: 'Account deleted successfully' };
//     } catch (error) {
//       console.error('❌ Account deletion failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to delete account' 
//       };
//     }
//   };

//   const forgotPassword = async (email) => {
//     console.log('📧 Requesting password reset for:', email);
//     try {
//       const response = await authAPI.forgotPassword(email);
//       console.log('✅ Password reset email sent:', response.data);
//       return { success: true, message: 'Password reset email sent' };
//     } catch (error) {
//       console.error('❌ Password reset request failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to send reset email' 
//       };
//     }
//   };

//   const resetPassword = async (token, newPassword) => {
//     console.log('🔑 Resetting password with token');
//     try {
//       const response = await authAPI.resetPassword(token, newPassword);
//       console.log('✅ Password reset successfully:', response.data);
//       return { success: true, message: 'Password reset successfully' };
//     } catch (error) {
//       console.error('❌ Password reset failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to reset password' 
//       };
//     }
//   };

//   const verifyEmail = async (token) => {
//     console.log('📧 Verifying email with token');
//     try {
//       const response = await authAPI.verifyEmail(token);
//       console.log('✅ Email verified:', response.data);
      
//       // Update user if email was verified
//       if (response.data.user) {
//         const updatedUser = { ...user, ...response.data.user };
//         setUser(updatedUser);
//         localStorage.setItem('user', JSON.stringify(updatedUser));
//       }
      
//       return { success: true, message: 'Email verified successfully' };
//     } catch (error) {
//       console.error('❌ Email verification failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to verify email' 
//       };
//     }
//   };

//   const resendVerification = async () => {
//     console.log('📧 Resending verification email');
//     try {
//       const response = await authAPI.resendVerification();
//       console.log('✅ Verification email resent:', response.data);
//       return { success: true, message: 'Verification email sent' };
//     } catch (error) {
//       console.error('❌ Resend verification failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to resend verification' 
//       };
//     }
//   };

//   const updatePreferences = async (preferences) => {
//     console.log('⚙️ Updating preferences:', preferences);
//     try {
//       const response = await authAPI.updatePreferences(preferences);
//       console.log('✅ Preferences updated:', response.data);
      
//       // Update user in state and localStorage
//       const updatedUser = { ...user, preferences: response.data.user.preferences };
//       setUser(updatedUser);
//       localStorage.setItem('user', JSON.stringify(updatedUser));
      
//       return { success: true, user: updatedUser };
//     } catch (error) {
//       console.error('❌ Preferences update failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to update preferences' 
//       };
//     }
//   };

//   const updateNotifications = async (settings) => {
//     console.log('🔔 Updating notification settings:', settings);
//     try {
//       const response = await authAPI.updateNotifications(settings);
//       console.log('✅ Notification settings updated:', response.data);
      
//       // Update user in state and localStorage
//       const updatedUser = { ...user, notificationSettings: response.data.user.notificationSettings };
//       setUser(updatedUser);
//       localStorage.setItem('user', JSON.stringify(updatedUser));
      
//       return { success: true, user: updatedUser };
//     } catch (error) {
//       console.error('❌ Notification settings update failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to update notification settings' 
//       };
//     }
//   };

//   const refreshUser = async () => {
//     console.log('🔄 Refreshing user data');
//     try {
//       const response = await authAPI.getProfile();
//       console.log('✅ User data refreshed:', response.data);
      
//       const updatedUser = response.data.user;
//       setUser(updatedUser);
//       localStorage.setItem('user', JSON.stringify(updatedUser));
      
//       return { success: true, user: updatedUser };
//     } catch (error) {
//       console.error('❌ Failed to refresh user data:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to refresh user data' 
//       };
//     }
//   };

//   const checkEmail = async (email) => {
//     console.log('📧 Checking if email exists:', email);
//     try {
//       const response = await authAPI.checkEmail(email);
//       console.log('✅ Email check result:', response.data);
//       return { 
//         success: true, 
//         exists: response.data.exists,
//         message: response.data.message 
//       };
//     } catch (error) {
//       console.error('❌ Email check failed:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to check email' 
//       };
//     }
//   };

//   const getUserStats = async () => {
//     console.log('📊 Getting user statistics');
//     try {
//       const response = await authAPI.getUserStats();
//       console.log('✅ User stats fetched:', response.data);
//       return { success: true, stats: response.data.stats };
//     } catch (error) {
//       console.error('❌ Failed to get user stats:', error);
//       return { 
//         success: false, 
//         error: error.response?.data?.error || 'Failed to get user statistics' 
//       };
//     }
//   };

//   const value = {
//     user,
//     loading,
//     error,
//     login,
//     logout,
//     updateProfile,
//     changePassword,
//     deleteAccount,
//     forgotPassword,
//     resetPassword,
//     verifyEmail,
//     resendVerification,
//     updatePreferences,
//     updateNotifications,
//     refreshUser,
//     checkEmail,
//     getUserStats,
//     isAuthenticated: !!user && !!localStorage.getItem('access_token')
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };








import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('👤 User restored from localStorage:', userData);
      } catch (e) {
        console.error('❌ Failed to parse user data:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // ============ REGISTER ============
  const register = async (userData) => {
    console.log('📝 Registering user with data:', userData);
    try {
      const response = await authAPI.register(userData);
      console.log('✅ Registration successful:', response.data);
      
      return { 
        success: true, 
        message: response.data.message || 'Registration successful! Please login.',
        data: response.data 
      };
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.error || 'Invalid registration data';
        } else if (error.response.status === 409) {
          errorMessage = 'User already exists with this email';
        } else if (error.response.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  // ============ LOGIN ============
  const login = async (userData) => {
    console.log('🔐 Login called with user data:', userData);
    try {
      setUser(userData);
      setError(null);
      console.log('✅ User set in context');
      return { success: true, user: userData };
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // ============ LOGOUT ============
  const logout = async () => {
    console.log('🚪 Logout called');
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('⚠️ Logout API call failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      console.log('✅ User logged out');
    }
  };

  // ============ UPDATE PROFILE ============
  const updateProfile = async (data) => {
    console.log('🔄 Updating profile with data:', data);
    try {
      const response = await authAPI.updateProfile(data);
      console.log('✅ Profile updated:', response.data);
      
      let updatedUser;
      if (response.data.user) {
        updatedUser = { ...user, ...response.data.user };
      } else {
        console.log('🔄 Fetching fresh user data...');
        const profileResponse = await authAPI.getProfile();
        updatedUser = { ...user, ...profileResponse.data.user };
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { 
        success: true, 
        user: updatedUser,
        message: response.data.message || 'Profile updated successfully'
      };
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update profile' 
      };
    }
  };

  // ============ CHANGE PASSWORD ============
  const changePassword = async (currentPassword, newPassword) => {
    console.log('🔑 Changing password');
    try {
      const response = await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      console.log('✅ Password changed successfully');
      return { success: true, message: 'Password changed successfully' };
    } catch (error) {
      console.error('❌ Password change failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to change password' 
      };
    }
  };

  // ============ DELETE ACCOUNT ============
  const deleteAccount = async () => {
    console.log('🗑️ Deleting user account');
    try {
      const response = await authAPI.deleteAccount();
      console.log('✅ Account deleted:', response.data);
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setUser(null);
      
      return { success: true, message: 'Account deleted successfully' };
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to delete account' 
      };
    }
  };

  // ============ FORGOT PASSWORD ============
  const forgotPassword = async (email) => {
    console.log('📧 Requesting password reset for:', email);
    try {
      const response = await authAPI.forgotPassword(email);
      console.log('✅ Password reset email sent:', response.data);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('❌ Password reset request failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to send reset email' 
      };
    }
  };

  // ============ RESET PASSWORD ============
  const resetPassword = async (token, newPassword) => {
    console.log('🔑 Resetting password with token');
    try {
      const response = await authAPI.resetPassword(token, newPassword);
      console.log('✅ Password reset successfully:', response.data);
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to reset password' 
      };
    }
  };

  // ============ VERIFY EMAIL ============
  const verifyEmail = async (token) => {
    console.log('📧 Verifying email with token');
    try {
      const response = await authAPI.verifyEmail(token);
      console.log('✅ Email verified:', response.data);
      
      if (response.data.user) {
        const updatedUser = { ...user, ...response.data.user };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to verify email' 
      };
    }
  };

  // ============ RESEND VERIFICATION ============
  const resendVerification = async () => {
    console.log('📧 Resending verification email');
    try {
      const response = await authAPI.resendVerification();
      console.log('✅ Verification email resent:', response.data);
      return { success: true, message: 'Verification email sent' };
    } catch (error) {
      console.error('❌ Resend verification failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to resend verification' 
      };
    }
  };

  // ============ UPDATE PREFERENCES ============
  const updatePreferences = async (preferences) => {
    console.log('⚙️ Updating preferences:', preferences);
    try {
      const response = await authAPI.updatePreferences(preferences);
      console.log('✅ Preferences updated:', response.data);
      
      const updatedUser = { ...user, preferences: response.data.user.preferences };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('❌ Preferences update failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update preferences' 
      };
    }
  };

  // ============ UPDATE NOTIFICATIONS ============
  const updateNotifications = async (settings) => {
    console.log('🔔 Updating notification settings:', settings);
    try {
      const response = await authAPI.updateNotifications(settings);
      console.log('✅ Notification settings updated:', response.data);
      
      const updatedUser = { ...user, notificationSettings: response.data.user.notificationSettings };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('❌ Notification settings update failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to update notification settings' 
      };
    }
  };

  // ============ REFRESH USER ============
  const refreshUser = async () => {
    console.log('🔄 Refreshing user data');
    try {
      const response = await authAPI.getProfile();
      console.log('✅ User data refreshed:', response.data);
      
      const updatedUser = response.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to refresh user data' 
      };
    }
  };

  // ============ CHECK EMAIL ============
  const checkEmail = async (email) => {
    console.log('📧 Checking if email exists:', email);
    try {
      const response = await authAPI.checkEmail(email);
      console.log('✅ Email check result:', response.data);
      return { 
        success: true, 
        exists: response.data.exists,
        message: response.data.message 
      };
    } catch (error) {
      console.error('❌ Email check failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to check email' 
      };
    }
  };

  // ============ GET USER STATS ============
  const getUserStats = async () => {
    console.log('📊 Getting user statistics');
    try {
      const response = await authAPI.getUserStats();
      console.log('✅ User stats fetched:', response.data);
      return { success: true, stats: response.data.stats };
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get user statistics' 
      };
    }
  };

  // ============ VALUE OBJECT ============
  const value = {
    user,
    loading,
    error,
    register, // <-- ADD THIS LINE
    login,
    logout,
    updateProfile,
    changePassword,
    deleteAccount,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    updatePreferences,
    updateNotifications,
    refreshUser,
    checkEmail,
    getUserStats,
    isAuthenticated: !!user && !!localStorage.getItem('access_token')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};