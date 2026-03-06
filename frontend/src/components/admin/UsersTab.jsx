import React, { useState, useEffect } from 'react';
import { 
  Gift, Coins, Award, User, DollarSign, Check, X, RefreshCw,
  BadgeCheck, Briefcase, UserX
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from '../../hooks/use-toast';
import { 
  adminGetUsers, 
  adminGiftTokens, 
  adminUpdateUserRole,
  adminGetCashouts,
  adminProcessCashout,
  adminDeleteUser
} from '../../services/api';

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [giftTokens, setGiftTokens] = useState(10);
  const [giftMessage, setGiftMessage] = useState('');
  const [isGifting, setIsGifting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [staffTitle, setStaffTitle] = useState('');
  const [cashouts, setCashouts] = useState([]);
  const [showCashouts, setShowCashouts] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCashouts();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminGetUsers();
      setUsers(data);
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchCashouts = async () => {
    try {
      const data = await adminGetCashouts();
      setCashouts(data);
    } catch (err) {
      console.error('Error fetching cashouts:', err);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'admin') {
      toast({ title: 'Error', description: 'Cannot delete admin users', variant: 'destructive' });
      return;
    }
    
    if (!window.confirm(`Delete user "${user.name}"? This will remove all their posts, messages, and data. This cannot be undone.`)) {
      return;
    }
    
    setDeletingUser(user.id);
    try {
      await adminDeleteUser(user.id);
      setUsers(users.filter(u => u.id !== user.id));
      toast({ title: 'Success', description: `User ${user.name} deleted` });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setDeletingUser(null);
    }
  };

  const handleGiftTokens = async () => {
    if (!selectedUser || giftTokens < 1) return;
    
    setIsGifting(true);
    try {
      const result = await adminGiftTokens(selectedUser.id, giftTokens, giftMessage || null);
      toast({ 
        title: 'Tokens Gifted!', 
        description: `${giftTokens} tokens sent to ${result.user_name}. New balance: ${result.new_balance}` 
      });
      
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id 
          ? { ...u, token_balance: result.new_balance }
          : u
      ));
      
      setSelectedUser(null);
      setGiftTokens(10);
      setGiftMessage('');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsGifting(false);
    }
  };

  const handleUpdateRole = async (userId) => {
    if (!newRole) return;
    
    try {
      await adminUpdateUserRole(userId, newRole, newRole === 'staff' ? staffTitle : null);
      toast({ title: 'Role Updated', description: `User role changed to ${newRole}` });
      
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, role: newRole, staff_title: newRole === 'staff' ? staffTitle : u.staff_title }
          : u
      ));
      
      setEditingRole(null);
      setNewRole('');
      setStaffTitle('');
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleProcessCashout = async (cashoutId, status) => {
    try {
      await adminProcessCashout(cashoutId, status);
      toast({ title: 'Cashout Processed', description: `Request ${status}` });
      setCashouts(prev => prev.map(c => 
        c.id === cashoutId ? { ...c, status } : c
      ));
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const getRoleBadge = (role, staffTitle) => {
    const config = {
      admin: { label: 'Admin', color: 'bg-red-600', icon: BadgeCheck },
      management: { label: 'Management', color: 'bg-purple-600', icon: Briefcase },
      staff: { label: staffTitle || 'Staff', color: 'bg-blue-600', icon: Award },
      customer: { label: 'Member', color: 'bg-slate-600', icon: User }
    };
    const c = config[role] || config.customer;
    const Icon = c.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${c.color}`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingCashouts = cashouts.filter(c => c.status === 'pending');

  if (loading) return <div className="text-white text-center py-8">Loading users...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">User Profiles ({users.length})</h3>
        <Button
          variant={showCashouts ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCashouts(!showCashouts)}
          className={showCashouts ? "bg-green-600" : "border-slate-600 text-slate-300"}
        >
          <DollarSign className="w-4 h-4 mr-1" />
          Cashouts {pendingCashouts.length > 0 && `(${pendingCashouts.length})`}
        </Button>
      </div>

      {/* Pending Cashouts */}
      {showCashouts && pendingCashouts.length > 0 && (
        <Card className="bg-green-900/30 border-green-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Pending Cashout Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingCashouts.map(co => (
              <div key={co.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                <div>
                  <p className="text-white font-medium">${co.amount_usd.toFixed(2)} via {co.payment_method}</p>
                  <p className="text-xs text-slate-400">{co.payment_details}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleProcessCashout(co.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleProcessCashout(co.id, 'rejected')}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white flex-1"
          data-testid="user-search-input"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white rounded-md px-3"
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="staff">Staff</option>
          <option value="management">Management</option>
        </select>
      </div>

      {/* Gift Tokens Modal */}
      {selectedUser && !editingRole && (
        <Card className="bg-amber-900/30 border-amber-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              Gift Tokens to {selectedUser.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">Current balance:</span>
              <span className="text-amber-400 font-bold">{selectedUser.token_balance || 0} tokens</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => setGiftTokens(amount)}
                  className={`p-2 rounded-lg border transition-all ${
                    giftTokens === amount
                      ? 'border-amber-500 bg-amber-500/20 text-white'
                      : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                value={giftTokens}
                onChange={e => setGiftTokens(Math.max(1, parseInt(e.target.value) || 1))}
                className="bg-slate-800 border-slate-600 text-white w-24"
              />
              <span className="text-slate-400">tokens (${(giftTokens / 10).toFixed(2)} value)</span>
            </div>

            <Input
              placeholder="Optional message..."
              value={giftMessage}
              onChange={e => setGiftMessage(e.target.value)}
              className="bg-slate-800 border-slate-600 text-white"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleGiftTokens}
                disabled={isGifting}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                data-testid="confirm-gift-btn"
              >
                <Coins className="w-4 h-4 mr-2" />
                {isGifting ? 'Sending...' : `Gift ${giftTokens} Tokens`}
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedUser(null)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <Card className="bg-purple-900/30 border-purple-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              Change Role for {editingRole.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-300">Current role:</span>
              {getRoleBadge(editingRole.role, editingRole.staff_title)}
            </div>
            
            <div>
              <label className="text-sm text-slate-400 block mb-2">New Role</label>
              <div className="grid grid-cols-3 gap-2">
                {['customer', 'staff', 'management'].map(role => (
                  <button
                    key={role}
                    onClick={() => setNewRole(role)}
                    className={`p-2 rounded-lg border capitalize transition-all ${
                      newRole === role
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-slate-600 bg-slate-800 text-slate-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {newRole === 'staff' && (
              <div>
                <label className="text-sm text-slate-400 block mb-2">Staff Title</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {['Bartender', 'Server', 'DJ', 'Host'].map(title => (
                    <button
                      key={title}
                      onClick={() => setStaffTitle(title)}
                      className={`p-2 rounded-lg border text-sm transition-all ${
                        staffTitle === title
                          ? 'border-blue-500 bg-blue-500/20 text-white'
                          : 'border-slate-600 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <Input
                  value={staffTitle}
                  onChange={e => setStaffTitle(e.target.value)}
                  placeholder="Or enter custom title..."
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => handleUpdateRole(editingRole.id)}
                disabled={!newRole}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Update Role
              </Button>
              <Button
                variant="outline"
                onClick={() => { setEditingRole(null); setNewRole(''); setStaffTitle(''); }}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 mx-auto text-slate-500 mb-2" />
            <p className="text-slate-400">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map(user => (
            <Card key={user.id} className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Profile Photo or Avatar */}
                    {user.profile_photo_url ? (
                      <img 
                        src={user.profile_photo_url.startsWith('http') ? user.profile_photo_url : `${process.env.REACT_APP_BACKEND_URL}${user.profile_photo_url}`}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-red-500"
                      />
                    ) : (
                      <span className="text-3xl">{user.avatar_emoji || '😊'}</span>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">{user.name}</p>
                        {getRoleBadge(user.role, user.staff_title)}
                      </div>
                      <p className="text-slate-400 text-sm">{user.email || 'No email'}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span>Visits: {user.total_visits || 0}</span>
                        <span>Posts: {user.total_posts || 0}</span>
                        {user.role === 'staff' && (
                          <span className="text-green-400">Tips: ${(user.cashout_balance || 0).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Token Balance */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Coins className="w-4 h-4" />
                        <span className="font-bold">{user.token_balance || 0}</span>
                      </div>
                      <span className="text-xs text-slate-500">tokens</span>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => { setEditingRole(user); setNewRole(user.role); setStaffTitle(user.staff_title || ''); }}
                        className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-600/50"
                        title="Change Role"
                      >
                        <Award className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                        className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-600/50"
                        data-testid={`gift-tokens-${user.id}`}
                        title="Gift Tokens"
                      >
                        <Gift className="w-4 h-4" />
                      </Button>
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={deletingUser === user.id}
                          className="bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-600/50"
                          data-testid={`delete-user-${user.id}`}
                          title="Delete User"
                        >
                          {deletingUser === user.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserX className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersTab;
