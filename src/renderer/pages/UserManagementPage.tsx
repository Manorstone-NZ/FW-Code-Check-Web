import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import logger from '../../utils/logger';

interface UserManagement {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at?: string;
  last_login?: string;
  is_active?: boolean;
  failed_login_attempts?: number;
  locked_until?: string;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    username: string;
    newPassword: string;
  }>({
    isOpen: false,
    userId: null,
    username: '',
    newPassword: ''
  });

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Administrator privileges required.');
      setLoading(false);
      return;
    }
    
    loadUsers();
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Call backend to get all users
      const result = await window.electronAPI.listUsers();
      if (result.success) {
        setUsers(result.users || []);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to load users: ' + (err instanceof Error ? err.message : 'Unknown error'));
      logger.error('Failed to load users', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate form
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setFormError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    try {
      setActionLoading({ create: true });
      
      const result = await window.electronAPI.registerUser(
        formData.username,
        formData.email,
        formData.password,
        formData.role
      );

      if (result.success) {
        setShowCreateForm(false);
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'user'
        });
        await loadUsers();
        logger.info('User created successfully', { username: formData.username, role: formData.role });
      } else {
        setFormError(result.error || 'Failed to create user');
      }
    } catch (err) {
      setFormError('Failed to create user: ' + (err instanceof Error ? err.message : 'Unknown error'));
      logger.error('Failed to create user', { error: err, formData: { ...formData, password: '[REDACTED]' } });
    } finally {
      setActionLoading({});
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (userId === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading({ [`delete_${userId}`]: true });
      
      const result = await window.electronAPI.deleteUser(userId);
      if (result.success) {
        await loadUsers();
        logger.info('User deleted successfully', { userId, username });
      } else {
        alert('Failed to delete user: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to delete user: ' + (err instanceof Error ? err.message : 'Unknown error'));
      logger.error('Failed to delete user', { error: err, userId, username });
    } finally {
      setActionLoading({});
    }
  };

  const handleToggleUserStatus = async (userId: number, username: string, currentStatus: boolean) => {
    if (userId === currentUser?.id) {
      alert('You cannot deactivate your own account');
      return;
    }

    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} user "${username}"?`)) {
      return;
    }

    try {
      setActionLoading({ [`toggle_${userId}`]: true });
      
      const result = await window.electronAPI.toggleUserStatus(userId, !currentStatus);
      if (result.success) {
        await loadUsers();
        logger.info(`User ${action}d successfully`, { userId, username });
      } else {
        alert(`Failed to ${action} user: ` + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert(`Failed to ${action} user: ` + (err instanceof Error ? err.message : 'Unknown error'));
      logger.error(`Failed to ${action} user`, { error: err, userId, username });
    } finally {
      setActionLoading({});
    }
  };

  const handleResetPassword = async (userId: number, username: string) => {
    // Open the reset password modal instead of using window.prompt
    setResetPasswordModal({
      isOpen: true,
      userId,
      username,
      newPassword: ''
    });
  };

  const executePasswordReset = async () => {
    const { userId, username, newPassword } = resetPasswordModal;
    
    if (!userId || !newPassword) return;

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [`reset_${userId}`]: true }));
      
      const result = await window.electronAPI.resetUserPassword(userId, newPassword);
      
      if (result.success) {
        alert('Password reset successfully');
        logger.info('Password reset successfully', { userId, username });
        // Close modal on success
        setResetPasswordModal({ isOpen: false, userId: null, username: '', newPassword: '' });
      } else {
        alert('Failed to reset password: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to reset password: ' + (err instanceof Error ? err.message : 'Unknown error'));
      logger.error('Failed to reset password', { error: err, userId, username });
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[`reset_${userId}`];
        return newState;
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'analyst':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center mb-4">
            <span className="h-12 w-12 text-red-500 flex items-center justify-center text-lg font-bold">ACCESS DENIED</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Access Denied</h2>
          <p className="text-gray-600 text-center">
            You need administrator privileges to access user management.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-center mb-4">
            <span className="h-12 w-12 text-red-500 flex items-center justify-center text-lg font-bold">ERROR</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Error</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={loadUsers}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
          >
            <span>Create User</span>
          </button>
        </div>

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New User</h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{formError}</p>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="analyst">Analyst</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 pr-24 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      <span className="select-none whitespace-nowrap">
                        {showPassword ? 'HIDE' : 'SHOW'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-6">
                  <button
                    type="submit"
                    disabled={actionLoading.create}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {actionLoading.create ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormError(null);
                      setFormData({
                        username: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                        role: 'user'
                      });
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm px-2 py-1 rounded font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {user.locked_until && new Date(user.locked_until) > new Date() && (
                          <span className="text-xs text-red-600 font-medium">Locked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.last_login)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.username, user.is_active || false)}
                          disabled={user.id === currentUser?.id || actionLoading[`toggle_${user.id}`]}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-md border-2 focus:outline-none focus:ring-4 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.is_active 
                              ? 'bg-orange-500 border-orange-600 text-white hover:bg-orange-600 hover:border-orange-700 focus:ring-orange-300' 
                              : 'bg-green-500 border-green-600 text-white hover:bg-green-600 hover:border-green-700 focus:ring-green-300'
                          }`}
                          style={user.is_active ? {
                            backgroundColor: '#f97316',
                            borderColor: '#ea580c',
                            color: '#ffffff'
                          } : {
                            backgroundColor: '#22c55e',
                            borderColor: '#16a34a',
                            color: '#ffffff'
                          }}
                        >
                          {actionLoading[`toggle_${user.id}`] ? '...' : (user.is_active ? 'Deactivate' : 'Activate')}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id, user.username)}
                          disabled={actionLoading[`reset_${user.id}`]}
                          className="px-4 py-2 text-sm font-semibold bg-blue-500 border-2 border-blue-600 text-white rounded-lg shadow-md hover:bg-blue-600 hover:border-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: '#3b82f6',
                            borderColor: '#2563eb',
                            color: '#ffffff'
                          }}
                        >
                          {actionLoading[`reset_${user.id}`] ? '...' : 'Reset Password'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          disabled={user.id === currentUser?.id || actionLoading[`delete_${user.id}`]}
                          className="px-4 py-2 text-sm font-semibold bg-red-500 border-2 border-red-600 text-white rounded-lg shadow-md hover:bg-red-600 hover:border-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 focus:ring-opacity-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: '#ef4444',
                            borderColor: '#dc2626',
                            color: '#ffffff'
                          }}
                        >
                          {actionLoading[`delete_${user.id}`] ? '...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">Total Users</h3>
              <p className="text-2xl font-bold text-blue-900">{users?.length || 0}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">Active Users</h3>
              <p className="text-2xl font-bold text-green-900">{users?.filter(u => u.is_active).length || 0}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-red-800">Administrators</h3>
              <p className="text-2xl font-bold text-red-900">{users?.filter(u => u.role === 'admin').length || 0}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800">Analysts</h3>
              <p className="text-2xl font-bold text-yellow-900">{users?.filter(u => u.role === 'analyst').length || 0}</p>
            </div>
          </div>
        </div>

        {/* Reset Password Modal */}
        {resetPasswordModal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Reset Password for {resetPasswordModal.username}
              </h2>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                executePasswordReset();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={resetPasswordModal.newPassword}
                    onChange={(e) => setResetPasswordModal(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password (min 8 characters)"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading[`reset_${resetPasswordModal.userId}`] || resetPasswordModal.newPassword.length < 8}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {actionLoading[`reset_${resetPasswordModal.userId}`] ? 'Resetting...' : 'Reset Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetPasswordModal({ isOpen: false, userId: null, username: '', newPassword: '' })}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
