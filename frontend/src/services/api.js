const BACKEND_URL = window.location.origin;
const API_URL = `${BACKEND_URL}/api`;

// Auth helper
function adminHeaders() {
  const token = localStorage.getItem('adminToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
function adminJsonHeaders() {
  return { ...adminHeaders(), 'Content-Type': 'application/json' };
}

// Base64 URL encode helper
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ==================== APP SETTINGS API ====================

// Get public app settings
export async function getAppSettings() {
  try {
    const response = await fetch(`${API_URL}/settings`);
    if (!response.ok) throw new Error('Failed to fetch settings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching app settings:', error);
    return { token_program_enabled: true, loyalty_program_enabled: true };
  }
}

// Get admin settings
export async function getAdminSettings() {
  try {
    const response = await fetch(`${API_URL}/admin/settings`, {
      headers: adminHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch admin settings');
    return await response.json();
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return { token_program_enabled: true, loyalty_program_enabled: true };
  }
}

// Update admin settings
export async function updateAdminSettings(settings) {
  try {
    const response = await fetch(`${API_URL}/admin/settings`, {
      method: 'PUT',
      headers: adminJsonHeaders(),
      body: JSON.stringify(settings)
    });
    if (!response.ok) throw new Error('Failed to update settings');
    return await response.json();
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}

// ==================== DJ SCHEDULE API ====================

// Get all public DJ schedules
// Get DJ schedules for a specific location
export async function getDJSchedulesForLocation(locationSlug) {
  try {
    const response = await fetch(`${API_URL}/dj/weekly-schedule/${locationSlug}`);
    if (!response.ok) throw new Error('Failed to fetch location DJ schedules');
    return await response.json();
  } catch (error) {
    console.error('Error fetching location DJ schedules:', error);
    return [];
  }
}

// Get DJ currently at a location
export async function getDJAtLocation(locationSlug) {
  try {
    const response = await fetch(`${API_URL}/dj/at-location/${locationSlug}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching DJ at location:', error);
    return null;
  }
}

// Admin: Get all DJ profiles
export async function getAdminDJProfiles() {
  try {
    const response = await fetch(`${API_URL}/admin/dj/profiles`, {
      headers: adminHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch DJ profiles');
    return await response.json();
  } catch (error) {
    console.error('Error fetching DJ profiles:', error);
    return [];
  }
}

// Admin: Create DJ profile
export async function createAdminDJProfile(profile) {
  const response = await fetch(`${API_URL}/admin/dj/profiles`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(profile)
  });
  if (!response.ok) throw new Error('Failed to create DJ profile');
  return await response.json();
}

// Admin: Update DJ profile
export async function updateAdminDJProfile(djId, update) {
  const response = await fetch(`${API_URL}/admin/dj/profiles/${djId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update DJ profile');
  return await response.json();
}

// Admin: Delete DJ profile
export async function deleteAdminDJProfile(djId) {
  const response = await fetch(`${API_URL}/admin/dj/profiles/${djId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete DJ profile');
  return await response.json();
}

// Admin: Get all DJ schedules
export async function getAdminDJSchedules() {
  try {
    const response = await fetch(`${API_URL}/admin/dj/schedules`, {
      headers: adminHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch DJ schedules');
    return await response.json();
  } catch (error) {
    console.error('Error fetching DJ schedules:', error);
    return [];
  }
}

// Admin: Create DJ schedule
export async function createAdminDJSchedule(schedule) {
  const response = await fetch(`${API_URL}/admin/dj/schedules`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(schedule)
  });
  if (!response.ok) throw new Error('Failed to create DJ schedule');
  return await response.json();
}

// Admin: Update DJ schedule
export async function updateAdminDJSchedule(scheduleId, update) {
  const response = await fetch(`${API_URL}/admin/dj/schedules/${scheduleId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update DJ schedule');
  return await response.json();
}

// Admin: Delete DJ schedule
export async function deleteAdminDJSchedule(scheduleId) {
  const response = await fetch(`${API_URL}/admin/dj/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete DJ schedule');
  return await response.json();
}

export async function bulkImportDJSchedule(payload) {
  const response = await fetch(`${API_URL}/dj/weekly-schedule/bulk`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to bulk import DJ schedule');
  return await response.json();
}

// ==================== PUBLIC API ====================

// Get public menu items (no auth required)
export async function getPublicMenuItems(locationSlug) {
  try {
    const url = locationSlug ? `${API_URL}/menu/items?location_slug=${locationSlug}` : `${API_URL}/menu/items`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch menu items');
    return await response.json();
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

// Get menu categories (no auth required)
// ==================== LOCATION API ====================

// Get all public locations
export async function getLocations() {
  try {
    const response = await fetch(`${API_URL}/locations`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return await response.json();
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

// Get single location by slug
export async function getLocationBySlug(slug) {
  try {
    const response = await fetch(`${API_URL}/locations/${slug}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch location');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching location:', error);
    return null;
  }
}

// Get VAPID public key from server
async function getVapidPublicKey() {
  try {
    const response = await fetch(`${API_URL}/push/public-key`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.publicKey;
  } catch {
    return null;
  }
}

// Register service worker and subscribe to push
export async function subscribeToPush(memberId) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const publicKey = await getVapidPublicKey();
    
    if (!publicKey) {
      throw new Error('Could not get VAPID public key');
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    // Save subscription to backend
    const response = await fetch(`${API_URL}/loyalty/subscribe-push/${memberId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error('Failed to save push subscription');
    }

    console.log('Push subscription successful');
    return true;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return false;
  }
}

// Loyalty signup
export async function signupLoyalty(data) {
  const response = await fetch(`${API_URL}/loyalty/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(result.detail || 'Signup failed');
  }

  return result;
}

// Contact form submission
// Send push notification (admin only)
export async function sendPushNotification(data) {
  try {
    const response = await fetch(`${API_URL}/admin/notifications/send`, {
      method: 'POST',
      headers: adminJsonHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}


// ==================== ADMIN API ====================

// Admin login
export async function adminLogin(username, password) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    let data = {};
    try {
      data = await response.json();
    } catch (parseError) {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.detail || 'Login failed');
    }

    localStorage.setItem('adminToken', data.access_token);
    return data;
  } catch (error) {
    throw error;
  }
}

// Admin logout
export function adminLogout() {
  localStorage.removeItem('adminToken');
}

// Check if admin is authenticated
// ==================== USER AUTH API ====================

// Initiate Google OAuth login
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export function initiateGoogleLogin() {
  const redirectUrl = window.location.origin + '/account';
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
}

// Process Google OAuth session (called from AuthCallback)
// Check if user is authenticated (via session cookie)
export async function checkUserAuth() {
  try {
    const response = await fetch(`${API_URL}/auth/user/me`, {
      credentials: 'include'
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    return null;
  }
}

// User logout (clears session)
export async function userLogout() {
  try {
    await fetch(`${API_URL}/auth/user/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
  
  // Clear local storage
  localStorage.removeItem('ff_user_profile_id');
  localStorage.removeItem('ff_user_info');
  localStorage.removeItem('ff_auth_provider');
}

// Register user with email and password
export async function registerUserWithPassword(email, password, name, username) {
  try {
    const response = await fetch(`${API_URL}/auth/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password, name, username })
    });

    if (!response.ok) {
      let detail = 'Registration failed';
      try { const err = await response.json(); detail = err.detail || detail; } catch (e) { /* parse error */ }
      throw new Error(detail);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Login user with username/email and password
export async function loginUserWithPassword(identifier, password) {
  try {
    const response = await fetch(`${API_URL}/auth/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ identifier, password })
    });

    if (!response.ok) {
      let detail = 'Login failed';
      try { const err = await response.json(); detail = err.detail || detail; } catch (e) { /* parse error */ }
      throw new Error(detail);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Request password reset
export async function requestPasswordReset(identifier) {
  try {
    const response = await fetch(`${API_URL}/auth/user/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier })
    });

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Reset password with token
export async function resetPasswordWithToken(token, password) {
  try {
    const response = await fetch(`${API_URL}/auth/user/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to reset password');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Verify reset token
export async function verifyResetToken(token) {
  try {
    const response = await fetch(`${API_URL}/auth/user/verify-reset-token?token=${encodeURIComponent(token)}`);
    return await response.json();
  } catch (error) {
    return { valid: false, message: 'Error verifying token' };
  }
}

// ==================== ADMIN USER MANAGEMENT ====================

// Get all admin users
export async function getAdminUsers() {
  const response = await fetch(`${API_URL}/admin/users/admins`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch admin users');
  return await response.json();
}

// Create new admin user
export async function createAdminUser(userData) {
  const response = await fetch(`${API_URL}/admin/users/admins`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create admin user');
  }
  return await response.json();
}

// Update admin user
export async function updateAdminUser(adminId, userData) {
  const response = await fetch(`${API_URL}/admin/users/admins/${adminId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update admin user');
  }
  return await response.json();
}

// Delete admin user
export async function deleteAdminUser(adminId) {
  const response = await fetch(`${API_URL}/admin/users/admins/${adminId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete admin user');
  }
  return await response.json();
}

// Change current admin's password
export async function changeAdminPassword(currentPassword, newPassword) {
  const response = await fetch(`${API_URL}/admin/users/admins/change-password`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to change password');
  }
  return await response.json();
}

// Get admin dashboard stats
export async function getAdminStats() {
  const response = await fetch(`${API_URL}/admin/stats`, {
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch stats');
  return await response.json();
}

// Get loyalty members
export async function getLoyaltyMembers() {
  const response = await fetch(`${API_URL}/admin/loyalty-members`, {
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch members');
  return await response.json();
}

// Delete loyalty member
export async function deleteLoyaltyMember(memberId) {
  const response = await fetch(`${API_URL}/admin/loyalty-members/${memberId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to delete member');
  return await response.json();
}

// Get contacts
export async function getContacts() {
  const response = await fetch(`${API_URL}/admin/contacts`, {
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch contacts');
  return await response.json();
}

// Update contact status
export async function updateContactStatus(contactId, status) {
  const response = await fetch(`${API_URL}/admin/contacts/${contactId}`, {
    method: 'PATCH',
    headers: adminJsonHeaders(),
    body: JSON.stringify({ status })
  });

  if (!response.ok) throw new Error('Failed to update contact');
  return await response.json();
}

// Delete contact (soft delete)
export async function deleteContact(contactId) {
  const response = await fetch(`${API_URL}/admin/contacts/${contactId}`, {
    method: 'DELETE',
    headers: adminJsonHeaders()
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete contact');
  }
  return await response.json();
}

// Page content (public)
export async function getPageContent(pageKey) {
  const response = await fetch(`${API_URL}/page-content/${pageKey}`);
  if (!response.ok) {
    throw new Error('Failed to fetch page content');
  }
  return await response.json();
}

// Page content (admin)
export async function updatePageContent(pageKey, sectionKey, html) {
  const response = await fetch(`${API_URL}/admin/page-content/${pageKey}/${sectionKey}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify({ html })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update page content');
  }
  return await response.json();
}

// Daily specials (public)
export async function getDailySpecials() {
  const response = await fetch(`${API_URL}/daily-specials`);
  if (!response.ok) {
    throw new Error('Failed to fetch daily specials');
  }
  return await response.json();
}

// Daily specials (admin)
export async function adminGetDailySpecials() {
  const response = await fetch(`${API_URL}/admin/daily-specials`, {
    headers: adminHeaders()
  });
  if (!response.ok) {
    throw new Error('Failed to fetch daily specials');
  }
  return await response.json();
}

export async function adminUpdateDailySpecials(payload) {
  const response = await fetch(`${API_URL}/admin/daily-specials`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update daily specials');
  }
  return await response.json();
}

// ==================== WEEKLY VIDEOS API ====================

export async function getWeeklyVideos() {
  try {
    const response = await fetch(`${API_URL}/weekly-videos`);
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

export async function adminGetWeeklyVideos() {
  const response = await fetch(`${API_URL}/admin/weekly-videos`, {
    headers: adminHeaders()
  });
  if (!response.ok) return [];
  return await response.json();
}

export async function adminUpdateWeeklyVideos(payload) {
  const response = await fetch(`${API_URL}/admin/weekly-videos`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update weekly videos');
  }
  return await response.json();
}

// ==================== MENU CATEGORY STYLES API ====================

// Get menu category display styles (public)
export async function getMenuCategoryStyles() {
  try {
    const response = await fetch(`${API_URL}/menu-category-styles`);
    if (!response.ok) throw new Error('Failed to fetch category styles');
    return await response.json();
  } catch (error) {
    console.error('Error fetching category styles:', error);
    return {};
  }
}

// Get menu category display styles (admin)
export async function adminGetMenuCategoryStyles() {
  const response = await fetch(`${API_URL}/admin/menu-category-styles`, {
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch category styles');
  return await response.json();
}

// Update menu category display styles (admin)
export async function adminUpdateMenuCategoryStyles(styles) {
  const response = await fetch(`${API_URL}/admin/menu-category-styles`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(styles)
  });

  if (!response.ok) throw new Error('Failed to update category styles');
  return await response.json();
}

// Get menu items (admin)
export async function getAdminMenuItems(locationSlug) {
  const url = locationSlug 
    ? `${API_URL}/admin/menu-items?location_slug=${locationSlug}` 
    : `${API_URL}/admin/menu-items`;
  const response = await fetch(url, {
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch menu items');
  return await response.json();
}

// Create menu item
export async function createMenuItem(item) {
  const response = await fetch(`${API_URL}/admin/menu-items`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(item)
  });

  if (!response.ok) throw new Error('Failed to create menu item');
  return await response.json();
}

// Update menu item
export async function updateMenuItem(itemId, update) {
  const response = await fetch(`${API_URL}/admin/menu-items/${itemId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });

  if (!response.ok) throw new Error('Failed to update menu item');
  return await response.json();
}

// Delete menu item
export async function deleteMenuItem(itemId) {
  const response = await fetch(`${API_URL}/admin/menu-items/${itemId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to delete menu item');
  return await response.json();
}

// Get notification history
export async function getNotificationHistory() {
  const response = await fetch(`${API_URL}/admin/notifications/history`, {
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch notifications');
  return await response.json();
}

// Upload image file
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/admin/upload`, {
    method: 'POST',
    headers: adminHeaders(),
    body: formData
  });

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to upload image');
  }
  return data;
}

// List uploaded images
// Delete uploaded image
// ==================== SPECIALS API ====================

// Get public specials (no auth)
export async function getPublicSpecials() {
  try {
    const response = await fetch(`${API_URL}/specials`);
    if (!response.ok) throw new Error('Failed to fetch specials');
    return await response.json();
  } catch (error) {
    console.error('Error fetching specials:', error);
    return [];
  }
}

// Get all specials (admin)
export async function getAdminSpecials() {
  const response = await fetch(`${API_URL}/admin/specials`, {
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to fetch specials');
  return await response.json();
}

// Create/Post a special (admin) - auto sends notification
export async function createSpecial(special) {
  const response = await fetch(`${API_URL}/admin/specials`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(special)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create special');
  }
  return await response.json();
}

// Update a special (admin)
export async function updateSpecial(specialId, update) {
  const response = await fetch(`${API_URL}/admin/specials/${specialId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });

  if (!response.ok) throw new Error('Failed to update special');
  return await response.json();
}

// Delete a special (admin)
export async function deleteSpecial(specialId) {
  const response = await fetch(`${API_URL}/admin/specials/${specialId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to delete special');
  return await response.json();
}

// Resend notification for a special (admin)
export async function resendSpecialNotification(specialId) {
  const response = await fetch(`${API_URL}/admin/specials/${specialId}/notify`, {
    method: 'POST',
    headers: adminHeaders()
  });

  if (!response.ok) throw new Error('Failed to send notification');
  return await response.json();
}

// ==================== SOCIAL LINKS API ====================

// Get public social links
export async function getPublicSocialLinks() {
  try {
    const response = await fetch(`${API_URL}/social-links`);
    if (!response.ok) throw new Error('Failed to fetch social links');
    return await response.json();
  } catch (error) {
    console.error('Error fetching social links:', error);
    return [];
  }
}

// Get admin social links
export async function getAdminSocialLinks() {
  const response = await fetch(`${API_URL}/admin/social-links`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch social links');
  return await response.json();
}

// Create social link
export async function createSocialLink(link) {
  const response = await fetch(`${API_URL}/admin/social-links`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(link)
  });
  if (!response.ok) throw new Error('Failed to create social link');
  return await response.json();
}

// Update social link
export async function updateSocialLink(linkId, update) {
  const response = await fetch(`${API_URL}/admin/social-links/${linkId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update social link');
  return await response.json();
}

// Delete social link
export async function deleteSocialLink(linkId) {
  const response = await fetch(`${API_URL}/admin/social-links/${linkId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete social link');
  return await response.json();
}

// ==================== INSTAGRAM FEED API ====================

// Get public Instagram feed
export async function getPublicInstagramFeed() {
  try {
    const response = await fetch(`${API_URL}/instagram-feed`);
    if (!response.ok) throw new Error('Failed to fetch Instagram feed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching Instagram feed:', error);
    return [];
  }
}

// Get admin Instagram posts
export async function getAdminInstagramPosts() {
  const response = await fetch(`${API_URL}/admin/instagram-posts`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch Instagram posts');
  return await response.json();
}

// Create Instagram post
export async function createInstagramPost(post) {
  const response = await fetch(`${API_URL}/admin/instagram-posts`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(post)
  });
  if (!response.ok) throw new Error('Failed to create Instagram post');
  return await response.json();
}

// Update Instagram post
// Delete Instagram post
export async function deleteInstagramPost(postId) {
  const response = await fetch(`${API_URL}/admin/instagram-posts/${postId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete Instagram post');
  return await response.json();
}


// ==================== LOCATION CHECK-IN API ====================

// Check in at a location
export async function checkInAtLocation(checkInData) {
  const response = await fetch(`${API_URL}/checkin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checkInData)
  });
  if (!response.ok) throw new Error('Failed to check in');
  return await response.json();
}

// Get users checked in at a location
export async function getCheckedInUsers(locationSlug) {
  try {
    const response = await fetch(`${API_URL}/checkin/${locationSlug}`);
    if (!response.ok) throw new Error('Failed to get check-ins');
    return await response.json();
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return [];
  }
}

// Check out from a location
export async function checkOut(checkInId) {
  const response = await fetch(`${API_URL}/checkin/${checkInId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to check out');
  return await response.json();
}

// Get check-in count for a location
// ==================== GALLERY API ====================

// Get public gallery items (no auth)
export async function getPublicGallery() {
  try {
    const response = await fetch(`${API_URL}/gallery`);
    if (!response.ok) throw new Error('Failed to fetch gallery');
    return await response.json();
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return [];
  }
}

// Get all gallery items (admin)
export async function getAdminGallery() {
  const response = await fetch(`${API_URL}/admin/gallery`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch gallery');
  return await response.json();
}

// Create gallery item (admin)
export async function createGalleryItem(item) {
  const response = await fetch(`${API_URL}/admin/gallery`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(item)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create gallery item');
  }
  return await response.json();
}

// Update gallery item (admin)
export async function updateGalleryItem(itemId, update) {
  const response = await fetch(`${API_URL}/admin/gallery/${itemId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update gallery item');
  return await response.json();
}

// Delete gallery item (admin)
export async function deleteGalleryItem(itemId) {
  const response = await fetch(`${API_URL}/admin/gallery/${itemId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete gallery item');
  return await response.json();
}


// ==================== HOMEPAGE CONTENT API ====================

// Get public homepage content (no auth)
export async function getHomepageContent() {
  try {
    const response = await fetch(`${API_URL}/homepage/content`);
    if (!response.ok) throw new Error('Failed to fetch homepage content');
    return await response.json();
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    return null;
  }
}

// Get homepage content (admin)
// Update homepage content (admin)
export async function updateHomepageContent(update) {
  const response = await fetch(`${API_URL}/admin/homepage/content`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update homepage content');
  return await response.json();
}

// Check if user is admin
// Verify admin token is still valid
export async function verifyAdminToken() {
  const token = localStorage.getItem('adminToken');
  if (!token) return false;
  
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: adminHeaders()
    });
    return response.ok;
  } catch {
    return false;
  }
}


// ==================== SOCIAL WALL API ====================

// Create a social post
export async function createSocialPost(post) {
  const response = await fetch(`${API_URL}/social/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create post');
  }
  return await response.json();
}

// Get social posts for a location
export async function getSocialPosts(locationSlug, myCheckinId = null) {
  const url = myCheckinId 
    ? `${API_URL}/social/posts/${locationSlug}?my_checkin_id=${myCheckinId}`
    : `${API_URL}/social/posts/${locationSlug}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch posts');
  return await response.json();
}

// Like/unlike a post
export async function likePost(postId, checkinId) {
  const response = await fetch(`${API_URL}/social/posts/${postId}/like?checkin_id=${checkinId}`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to like post');
  return await response.json();
}

// Delete a post
export async function deleteSocialPost(postId, checkinId) {
  const response = await fetch(`${API_URL}/social/posts/${postId}?checkin_id=${checkinId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete post');
  return await response.json();
}


// ==================== DIRECT MESSAGES API ====================

// Send a direct message
export async function sendDirectMessage(dm) {
  const response = await fetch(`${API_URL}/social/dm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dm)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send message');
  }
  return await response.json();
}

// Get all conversations for a user
export async function getConversations(checkinId) {
  const response = await fetch(`${API_URL}/social/dm/${checkinId}/conversations`);
  if (!response.ok) throw new Error('Failed to fetch conversations');
  return await response.json();
}

// Get message thread with a specific user
export async function getDMThread(checkinId, partnerId) {
  const response = await fetch(`${API_URL}/social/dm/${checkinId}/thread/${partnerId}`);
  if (!response.ok) throw new Error('Failed to fetch messages');
  return await response.json();
}

// Get unread message count
export async function getUnreadCount(checkinId) {
  const response = await fetch(`${API_URL}/social/dm/${checkinId}/unread`);
  if (!response.ok) throw new Error('Failed to get unread count');
  return await response.json();
}


// ==================== DJ TIPPING API ====================

// Send a tip to the DJ
export async function sendDJTip(tip) {
  const response = await fetch(`${API_URL}/social/dj-tip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tip)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send tip');
  }
  return await response.json();
}

// Get recent DJ tips for a location
export async function getDJTips(locationSlug) {
  const response = await fetch(`${API_URL}/social/dj-tips/${locationSlug}`);
  if (!response.ok) throw new Error('Failed to fetch tips');
  return await response.json();
}

// Get total DJ tips for today
export async function getDJTipsTotal(locationSlug) {
  const response = await fetch(`${API_URL}/social/dj-tips/${locationSlug}/total`);
  if (!response.ok) throw new Error('Failed to fetch tips total');
  return await response.json();
}


// ==================== SONG REQUEST & KARAOKE API ====================

// Submit a song request or karaoke sign up
export async function submitSongRequest(request) {
  const response = await fetch(`${API_URL}/social/song-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw new Error('Failed to submit song request');
  return await response.json();
}

// Get song requests for a location
// ==================== DJ PROFILE API ====================

// Register a new DJ
// Get all DJ profiles
// Get DJ profile by ID
// Update DJ profile
// DJ check-in at location
// DJ check-out
// ==================== SEND A DRINK API ====================

// Send a drink to another user
export async function sendDrink(order) {
  const response = await fetch(`${API_URL}/social/drinks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to send drink');
  }
  return await response.json();
}

// Get drinks at location (public feed)
export async function getDrinksAtLocation(locationSlug) {
  const response = await fetch(`${API_URL}/social/drinks/${locationSlug}`);
  if (!response.ok) throw new Error('Failed to fetch drinks');
  return await response.json();
}

// Get drinks for a specific user
export async function getDrinksForUser(checkinId) {
  const response = await fetch(`${API_URL}/social/drinks/for/${checkinId}`);
  if (!response.ok) throw new Error('Failed to fetch drinks');
  return await response.json();
}

// Update drink order status


// ==================== STRIPE PAYMENT API ====================

// Get available payment methods
// Create Stripe checkout for token purchase
export async function createStripeTokenCheckout(packageId, userId) {
  const originUrl = window.location.origin;
  const response = await fetch(`${API_URL}/stripe/tokens/checkout?package_id=${packageId}&user_id=${userId}&origin_url=${encodeURIComponent(originUrl)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create checkout session');
  }
  return await response.json();
}

// Create Stripe checkout for event tickets
export async function createStripeEventCheckout(packageId, quantity = 1, userId = null, eventId = null, customerEmail = null) {
  const originUrl = window.location.origin;
  let url = `${API_URL}/stripe/events/checkout?package_id=${packageId}&quantity=${quantity}&origin_url=${encodeURIComponent(originUrl)}`;
  if (userId) url += `&user_id=${userId}`;
  if (eventId) url += `&event_id=${eventId}`;
  if (customerEmail) url += `&customer_email=${encodeURIComponent(customerEmail)}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create checkout session');
  }
  return await response.json();
}

// Reserve free event tickets (no checkout)
export async function createFreeEventReservation(payload) {
  const response = await fetch(`${API_URL}/events/free-reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to reserve tickets');
  }
  return await response.json();
}

// Create Stripe checkout for merchandise
export async function createStripeMerchCheckout(items, customerEmail = null) {
  const originUrl = window.location.origin;
  const response = await fetch(`${API_URL}/stripe/merch/checkout?origin_url=${encodeURIComponent(originUrl)}${customerEmail ? `&customer_email=${encodeURIComponent(customerEmail)}` : ''}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(items)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create checkout session');
  }
  return await response.json();
}

// Get Stripe checkout status
export async function getStripeCheckoutStatus(sessionId) {
  const response = await fetch(`${API_URL}/stripe/checkout/status/${sessionId}`);
  if (!response.ok) throw new Error('Failed to get checkout status');
  return await response.json();
}

// Get event packages
export async function getEventPackages() {
  const response = await fetch(`${API_URL}/events/packages`);
  if (!response.ok) throw new Error('Failed to fetch event packages');
  return await response.json();
}

// Poll payment status (utility function)
export async function pollStripePaymentStatus(sessionId, maxAttempts = 5, interval = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getStripeCheckoutStatus(sessionId);
    if (status.payment_status === 'paid') {
      return { success: true, status };
    }
    if (status.status === 'expired') {
      return { success: false, status, error: 'Payment expired' };
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return { success: false, status: { payment_status: 'pending' }, error: 'Timeout' };
}

// ==================== USER PROFILE API ====================

// Create user profile
export async function createUserProfile(profile) {
  const response = await fetch(`${API_URL}/user/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  if (!response.ok) {
    let detail = 'Failed to create profile';
    try { const err = await response.json(); detail = err.detail || detail; } catch (e) { /* parse error */ }
    throw new Error(detail);
  }
  return await response.json();
}

// Get user profile by ID
export async function getUserProfile(userId) {
  const response = await fetch(`${API_URL}/user/profile/${userId}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch profile');
  }
  return await response.json();
}

// Get user profile by email
export async function getUserProfileByEmail(email) {
  const response = await fetch(`${API_URL}/user/profile/by-email/${encodeURIComponent(email)}`);
  if (!response.ok) return null;
  return await response.json();
}

// Update user profile
export async function updateUserProfile(userId, update) {
  const response = await fetch(`${API_URL}/user/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update profile');
  return await response.json();
}

// Upload profile photo
export async function uploadProfilePhoto(userId, file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/user/profile/${userId}/photo`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload photo');
  }
  return await response.json();
}


// ==================== F&F TOKENS API ====================

// Get available token packages
export async function getTokenPackages() {
  const response = await fetch(`${API_URL}/tokens/packages`);
  if (!response.ok) throw new Error('Failed to get token packages');
  return await response.json();
}

// Create WooCommerce checkout for token purchase
export async function createTokenCheckout(userId, packageId) {
  const originUrl = window.location.origin;
  const response = await fetch(`${API_URL}/tokens/checkout?package_id=${packageId}&user_id=${userId}&origin_url=${encodeURIComponent(originUrl)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create checkout');
  }
  return await response.json();
}

// Check token checkout status (now uses transaction_id)
export async function checkTokenCheckoutStatus(transactionId) {
  const response = await fetch(`${API_URL}/tokens/checkout/status/${transactionId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to check checkout status');
  }
  return await response.json();
}

// Purchase tokens (admin gifting only)
export async function purchaseTokens(userId, amountUsd) {
  const response = await fetch(`${API_URL}/user/tokens/purchase/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount_usd: amountUsd })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to purchase tokens');
  }
  return await response.json();
}

// ==================== CART & CHECKOUT API ====================

// Create cart checkout for merchandise
export async function createCartCheckout(items, customerEmail = null, customerName = null) {
  const originUrl = window.location.origin;
  const response = await fetch(`${API_URL}/cart/checkout?origin_url=${encodeURIComponent(originUrl)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: items.map(item => ({
        product_id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        quantity: item.quantity || 1,
        image: item.image
      })),
      customer_email: customerEmail,
      customer_name: customerName
    })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create checkout');
  }
  return await response.json();
}

// Get cart order status
export async function getCartOrderStatus(orderId) {
  const response = await fetch(`${API_URL}/cart/order/${orderId}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get order status');
  }
  return await response.json();
}

// Get token balance
export async function getTokenBalance(userId) {
  const response = await fetch(`${API_URL}/user/tokens/balance/${userId}`);
  if (!response.ok) throw new Error('Failed to get token balance');
  return await response.json();
}

// Get token history
export async function getTokenHistory(userId) {
  const response = await fetch(`${API_URL}/user/tokens/history/${userId}`);
  if (!response.ok) throw new Error('Failed to get token history');
  return await response.json();
}

// Spend tokens
// Admin: Gift tokens
export async function adminGiftTokens(userId, tokens, message = null) {
  const response = await fetch(`${API_URL}/admin/tokens/gift`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify({ user_id: userId, tokens, message })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to gift tokens');
  }
  return await response.json();
}

// Admin: Get all users
export async function adminGetUsers() {
  const response = await fetch(`${API_URL}/admin/users`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return await response.json();
}


// ==================== USER HISTORY API ====================

// Get user's visit history
export async function getUserVisits(userId) {
  const response = await fetch(`${API_URL}/user/history/visits/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch visits');
  return await response.json();
}

// Get user's post history
// Get user's drink history
// Get user's tip history
// ==================== USER GALLERY SUBMISSION API ====================

// Submit photo to gallery
export async function submitGalleryPhoto(userId, imageUrl, caption = null, locationSlug = null) {
  const response = await fetch(`${API_URL}/user/gallery/submit/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, location_slug: locationSlug })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to submit photo');
  }
  return await response.json();
}

// Get user's gallery submissions
export async function getUserGallerySubmissions(userId) {
  const response = await fetch(`${API_URL}/user/gallery/submissions/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch submissions');
  return await response.json();
}


// ==================== TOKEN TRANSFER API ====================

// Transfer tokens to another user
export async function transferTokens(fromUserId, toUserId, amount, transferType = 'transfer', message = null) {
  const response = await fetch(`${API_URL}/user/tokens/transfer/${fromUserId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_user_id: toUserId, amount, transfer_type: transferType, message })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to transfer tokens');
  }
  return await response.json();
}

// Get user's transfer history
export async function getTransferHistory(userId) {
  const response = await fetch(`${API_URL}/user/tokens/transfers/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch transfers');
  return await response.json();
}


// ==================== STAFF API ====================

// Get list of staff members (for tipping)
export async function getStaffList() {
  const response = await fetch(`${API_URL}/staff/list`);
  if (!response.ok) throw new Error('Failed to fetch staff');
  return await response.json();
}

// Staff: Request cashout (min $20, 80% rate)
export async function requestCashout(userId, amountTokens, paymentMethod, paymentDetails) {
  const response = await fetch(`${API_URL}/staff/cashout/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount_tokens: amountTokens, payment_method: paymentMethod, payment_details: paymentDetails })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to request cashout');
  }
  return await response.json();
}

// Staff: Get cashout history
export async function getCashoutHistory(userId) {
  const response = await fetch(`${API_URL}/staff/cashout/history/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch cashout history');
  return await response.json();
}

// Staff: Transfer tips to personal token balance
export async function transferTipsToPersonal(userId, amount) {
  const response = await fetch(`${API_URL}/staff/transfer-to-personal/${userId}?amount=${amount}`, {
    method: 'POST'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to transfer tips');
  }
  return await response.json();
}


// ==================== ADMIN ROLE MANAGEMENT API ====================

// Admin: Update user role
export async function adminUpdateUserRole(userId, newRole, staffTitle = null) {
  const response = await fetch(`${API_URL}/admin/users/role`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify({ user_id: userId, new_role: newRole, staff_title: staffTitle })
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update role');
  }
  return await response.json();
}

// Admin: Get all cashout requests
export async function adminGetCashouts() {
  const response = await fetch(`${API_URL}/admin/cashouts`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch cashouts');
  return await response.json();
}

// Admin: Process cashout request
export async function adminProcessCashout(cashoutId, status) {
  const response = await fetch(`${API_URL}/admin/cashouts/${cashoutId}?status=${status}`, {
    method: 'PUT',
    headers: adminHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to process cashout');
  }
  return await response.json();
}


// ==================== ADMIN LOCATION API ====================

// Get all locations (admin)
export async function adminGetLocations() {
  const response = await fetch(`${API_URL}/admin/locations`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch locations');
  return await response.json();
}

// Create location (admin)
export async function adminCreateLocation(location) {
  const response = await fetch(`${API_URL}/admin/locations`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(location)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create location');
  }
  return await response.json();
}

// Update location (admin)
export async function adminUpdateLocation(locationId, update) {
  const response = await fetch(`${API_URL}/admin/locations/${locationId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update location');
  }
  return await response.json();
}

// Delete location (admin)
export async function adminDeleteLocation(locationId) {
  const response = await fetch(`${API_URL}/admin/locations/${locationId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete location');
  }
  return await response.json();
}

// Reorder locations (admin)
// ==================== ADMIN EVENTS API ====================

// Get all events (public)
export async function getPublicEvents() {
  try {
    const response = await fetch(`${API_URL}/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return await response.json();
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// Get all events (admin)
export async function adminGetEvents() {
  const response = await fetch(`${API_URL}/admin/events`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch events');
  return await response.json();
}

// Create event (admin)
export async function adminCreateEvent(event) {
  const response = await fetch(`${API_URL}/admin/events`, {
    method: 'POST',
    headers: adminJsonHeaders(),
    body: JSON.stringify(event)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create event');
  }
  return await response.json();
}

// Update event (admin)
export async function adminUpdateEvent(eventId, update) {
  const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
    method: 'PUT',
    headers: adminJsonHeaders(),
    body: JSON.stringify(update)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to update event');
  }
  return await response.json();
}

// Delete event (admin)
export async function adminDeleteEvent(eventId) {
  const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete event');
  }
  return await response.json();
}


// ==================== ADMIN GALLERY SUBMISSIONS API ====================

// Get all gallery submissions (admin)
export async function adminGetGallerySubmissions() {
  const response = await fetch(`${API_URL}/admin/gallery-submissions`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch gallery submissions');
  return await response.json();
}

// Delete gallery submission (admin)
export async function adminDeleteGallerySubmission(submissionId) {
  const response = await fetch(`${API_URL}/admin/gallery-submissions/${submissionId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete submission');
  }
  return await response.json();
}


// ==================== ADMIN SOCIAL POSTS API ====================

// Get all social posts (admin)
export async function adminGetAllSocialPosts() {
  const response = await fetch(`${API_URL}/admin/social-posts`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch social posts');
  return await response.json();
}

// Delete social post (admin)
export async function adminDeleteSocialPost(postId) {
  const response = await fetch(`${API_URL}/admin/social-posts/${postId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete post');
  }
  return await response.json();
}

// Cleanup old posts (admin)
export async function adminCleanupOldPosts() {
  const response = await fetch(`${API_URL}/admin/social-posts/cleanup/old`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to cleanup posts');
  }
  return await response.json();
}

// Delete user (admin)
export async function adminDeleteUser(userId) {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete user');
  }
  return await response.json();
}



// ===================== CAREERS / JOB APPLICATIONS =====================

export async function getJobApplications() {
  const response = await fetch(`${API_URL}/admin/careers/applications`, {
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to fetch applications');
  return await response.json();
}

export async function updateApplicationStatus(id, status) {
  const response = await fetch(`${API_URL}/admin/careers/applications/${id}`, {
    method: 'PATCH',
    headers: adminJsonHeaders(),
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update application');
  return await response.json();
}

export async function deleteApplication(id) {
  const response = await fetch(`${API_URL}/admin/careers/applications/${id}`, {
    method: 'DELETE',
    headers: adminHeaders()
  });
  if (!response.ok) throw new Error('Failed to delete application');
  return await response.json();
}
