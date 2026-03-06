// Admin Components - Organized exports
// This file re-exports all admin tab components from their individual files

// Core components
export { default as LoginForm } from './LoginForm';
export { default as DashboardStats } from './DashboardStats';

// Tab components (sorted alphabetically)
export { default as AdminAccountsTab } from './AdminAccountsTab';
export { default as ContactsTab } from './ContactsTab';
export { default as DJScheduleTab } from './DJScheduleTab';
export { default as LoyaltyMembersTab } from './LoyaltyMembersTab';
export { default as NotificationsTab } from './NotificationsTab';
export { default as SettingsTab } from './SettingsTab';
export { default as SpecialsTab } from './SpecialsTab';
export { default as UsersTab } from './UsersTab';

// Re-export components that are still in AdminTabs.jsx
// These will be migrated to individual files over time
export { 
  MenuItemsTab, 
  GalleryTab, 
  LocationsTab, 
  VideosTab, 
  SocialTab, 
  EventsTab, 
  GallerySubmissionsTab, 
  SocialPostsTab
} from './AdminTabs';

// Other admin components
export { default as MenuImageEditor } from './MenuImageEditor';
export { default as PageContentTab } from './PageContentTab';
export { AdminProvider, useAdmin } from './AdminContext';
