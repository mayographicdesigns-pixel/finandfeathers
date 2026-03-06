import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Key } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { 
  getAdminUsers, 
  createAdminUser, 
  updateAdminUser, 
  deleteAdminUser,
  changeAdminPassword,
  adminLogout 
} from '../../services/api';

const AdminAccountsTab = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    is_super_admin: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setAdmins(data);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.password) {
      toast({ title: 'Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    try {
      await createAdminUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        is_super_admin: formData.is_super_admin
      });
      
      toast({ title: 'Success', description: 'Admin account created' });
      setShowCreateForm(false);
      setFormData({ username: '', email: '', password: '', confirmPassword: '', is_super_admin: false });
      fetchAdmins();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin) return;
    
    const updateData = {};
    if (formData.email) updateData.email = formData.email;
    if (formData.password) {
      if (formData.password !== formData.confirmPassword) {
        toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
        return;
      }
      updateData.password = formData.password;
    }
    updateData.is_super_admin = formData.is_super_admin;

    try {
      await updateAdminUser(editingAdmin.id, updateData);
      toast({ title: 'Success', description: 'Admin account updated' });
      setEditingAdmin(null);
      setFormData({ username: '', email: '', password: '', confirmPassword: '', is_super_admin: false });
      fetchAdmins();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin account?')) return;
    
    try {
      await deleteAdminUser(adminId);
      toast({ title: 'Success', description: 'Admin account deleted' });
      fetchAdmins();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast({ title: 'Error', description: 'All password fields are required', variant: 'destructive' });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast({ title: 'Error', description: 'New password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    try {
      await changeAdminPassword(passwordData.currentPassword, passwordData.newPassword);
      toast({ title: 'Success', description: 'Password changed successfully. Please login with your new password.' });
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      // Logout and redirect to login
      adminLogout();
      window.location.reload();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const startEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      email: admin.email || '',
      password: '',
      confirmPassword: '',
      is_super_admin: admin.is_super_admin || false
    });
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-400">Loading admin accounts...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          Admin Accounts
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPasswordForm(true)}
            variant="outline"
            className="border-slate-600 text-slate-300"
            data-testid="change-password-btn"
          >
            <Key className="w-4 h-4 mr-2" />
            Change My Password
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-red-600 hover:bg-red-700"
            data-testid="create-admin-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Admin
          </Button>
        </div>
      </div>

      {/* Change Password Form */}
      {showPasswordForm && (
        <Card className="bg-slate-800 border-amber-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Change Your Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Current Password</label>
                <Input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                  data-testid="current-password-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                  data-testid="new-password-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                  required
                  data-testid="confirm-new-password-input"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                  Change Password
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowPasswordForm(false)} className="border-slate-600">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Create Admin Form */}
      {showCreateForm && (
        <Card className="bg-slate-800 border-green-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              Create New Admin Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Username *</label>
                  <Input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                    data-testid="admin-username-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                    data-testid="admin-email-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Password *</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                    data-testid="admin-password-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password *</label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    required
                    data-testid="admin-confirm-password-input"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_super_admin"
                  checked={formData.is_super_admin}
                  onChange={(e) => setFormData({ ...formData, is_super_admin: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_super_admin" className="text-slate-300">Super Admin (can manage other admins)</label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Create Admin
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)} className="border-slate-600">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Admin Form */}
      {editingAdmin && (
        <Card className="bg-slate-800 border-blue-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-500" />
              Edit Admin: {editingAdmin.username}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">New Password (leave blank to keep current)</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New Password</label>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="bg-slate-900 border-slate-700 text-white"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_super_admin"
                  checked={formData.is_super_admin}
                  onChange={(e) => setFormData({ ...formData, is_super_admin: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="edit_is_super_admin" className="text-slate-300">Super Admin</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateAdmin} className="bg-blue-600 hover:bg-blue-700">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingAdmin(null)} className="border-slate-600">
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin List */}
      <div className="grid gap-4">
        {admins.map((admin) => (
          <Card key={admin.id} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
                    <Shield className={`w-6 h-6 ${admin.is_super_admin ? 'text-amber-500' : 'text-red-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{admin.username}</h3>
                      {admin.is_super_admin && (
                        <span className="bg-amber-600/20 text-amber-400 text-xs px-2 py-0.5 rounded">Super Admin</span>
                      )}
                      {admin.id === 'admin-001' && (
                        <span className="bg-slate-600/20 text-slate-400 text-xs px-2 py-0.5 rounded">Legacy</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm">{admin.email}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Created: {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {admin.id !== 'admin-001' && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(admin)}
                        className="text-blue-400 hover:text-blue-300"
                        data-testid={`edit-admin-${admin.username}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        className="text-red-400 hover:text-red-300"
                        data-testid={`delete-admin-${admin.username}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Login Info */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardContent className="p-4">
          <h3 className="text-slate-400 text-sm font-medium mb-2">Login Information</h3>
          <p className="text-slate-500 text-xs">
            Admin users can login at <span className="text-slate-300">/admin</span> using either their username or email address along with their password.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccountsTab;
