import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, LogOut, BarChart3, Megaphone, Ticket, Grid3X3, ImageUp, MessageSquare,
  MapPin, Video, Share2, UtensilsCrossed, Coins, Users, Mail, Bell, Shield, FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { adminLogout, checkAdminAuth, getAdminStats } from '../services/api';
import {
  LoginForm,
  DashboardStats,
  LoyaltyMembersTab,
  ContactsTab,
  MenuItemsTab,
  AdminAccountsTab,
  NotificationsTab,
  SpecialsTab,
  GalleryTab,
  LocationsTab,
  VideosTab,
  SocialTab,
  EventsTab,
  GallerySubmissionsTab,
  SocialPostsTab,
  UsersTab
} from '../components/admin/AdminTabs';
import PageContentTab from '../components/admin/PageContentTab';
// Main Admin Page Component
const AdminPage = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = await checkAdminAuth();
    setIsAuthenticated(!!user);
    setLoading(false);
    if (user) {
      fetchStats();
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    }
  };

  const handleLogout = () => {
    adminLogout();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={checkAuth} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'specials', label: 'Post Special', icon: Megaphone },
    { id: 'events', label: 'Events', icon: Ticket },
    { id: 'gallery', label: 'Gallery', icon: Grid3X3 },
    { id: 'submissions', label: 'Submissions', icon: ImageUp },
    { id: 'posts', label: 'Posts', icon: MessageSquare },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'social', label: 'Social Links', icon: Share2 },
    { id: 'menu', label: 'Menu Items', icon: UtensilsCrossed },
    { id: 'page-content', label: 'Page Content', icon: FileText },
    { id: 'users', label: 'Users', icon: Coins },
    { id: 'members', label: 'Loyalty', icon: Users },
    { id: 'contacts', label: 'Contacts', icon: Mail },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'admins', label: 'Admin Accounts', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-black" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_57379523-4651-4150-aa1e-60b8df6a4f7c/artifacts/zzljit87_Untitled%20design.png" 
              alt="Fin & Feathers"
              className="h-10 cursor-pointer"
              onClick={() => navigate('/')}
            />
            <span className="text-white font-semibold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-slate-300 hover:text-white"
            >
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
              data-testid="admin-logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div>
            <DashboardStats stats={stats} />
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button onClick={() => setActiveTab('specials')} className="bg-red-600 hover:bg-red-700">
                    <Megaphone className="w-4 h-4 mr-2" /> Post Special
                  </Button>
                  <Button onClick={() => setActiveTab('gallery')} className="bg-orange-600 hover:bg-orange-700">
                    <Grid3X3 className="w-4 h-4 mr-2" /> Manage Gallery
                  </Button>
                  <Button onClick={() => setActiveTab('menu')} className="bg-yellow-600 hover:bg-yellow-700">
                    <UtensilsCrossed className="w-4 h-4 mr-2" /> Manage Menu
                  </Button>
                  <Button onClick={() => setActiveTab('notifications')} className="bg-purple-600 hover:bg-purple-700">
                    <Bell className="w-4 h-4 mr-2" /> Send Notification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'specials' && <SpecialsTab />}
        {activeTab === 'events' && <EventsTab />}
        {activeTab === 'gallery' && <GalleryTab />}
        {activeTab === 'submissions' && <GallerySubmissionsTab />}
        {activeTab === 'posts' && <SocialPostsTab />}
        {activeTab === 'locations' && <LocationsTab />}
        {activeTab === 'videos' && <VideosTab />}
        {activeTab === 'social' && <SocialTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'members' && <LoyaltyMembersTab />}
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'menu' && <MenuItemsTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'admins' && <AdminAccountsTab />}
      </div>
    </div>
  );
};

export default AdminPage;
