const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

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

// ==================== PUBLIC API ====================

// Get public menu items (no auth required)
export async function getPublicMenuItems() {
  try {
    const response = await fetch(`${API_URL}/menu/items`);
    if (!response.ok) throw new Error('Failed to fetch menu items');
    return await response.json();
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

// Get menu categories (no auth required)
export async function getMenuCategories() {
  try {
    const response = await fetch(`${API_URL}/menu/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return await response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

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
export async function getVapidPublicKey() {
  try {
    const response = await fetch(`${API_URL}/push/public-key`);
    const data = await response.json();
    return data.publicKey;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
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
  try {
    const response = await fetch(`${API_URL}/loyalty/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Signup failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Contact form submission
export async function submitContactForm(data) {
  try {
    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to submit contact form');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

// Send push notification (admin only)
export async function sendPushNotification(data) {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_URL}/admin/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
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
export async function checkAdminAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      localStorage.removeItem('adminToken');
      return null;
    }

    return await response.json();
  } catch (error) {
    localStorage.removeItem('adminToken');
    return null;
  }
}

// Get admin dashboard stats
export async function getAdminStats() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch stats');
  return await response.json();
}

// Get loyalty members
export async function getLoyaltyMembers() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/loyalty-members`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch members');
  return await response.json();
}

// Delete loyalty member
export async function deleteLoyaltyMember(memberId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/loyalty-members/${memberId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to delete member');
  return await response.json();
}

// Get contacts
export async function getContacts() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/contacts`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch contacts');
  return await response.json();
}

// Update contact status
export async function updateContactStatus(contactId, status) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/contacts/${contactId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) throw new Error('Failed to update contact');
  return await response.json();
}

// Get menu items (admin)
export async function getAdminMenuItems() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/menu-items`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch menu items');
  return await response.json();
}

// Create menu item
export async function createMenuItem(item) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/menu-items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(item)
  });

  if (!response.ok) throw new Error('Failed to create menu item');
  return await response.json();
}

// Update menu item
export async function updateMenuItem(itemId, update) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/menu-items/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(update)
  });

  if (!response.ok) throw new Error('Failed to update menu item');
  return await response.json();
}

// Delete menu item
export async function deleteMenuItem(itemId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/menu-items/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to delete menu item');
  return await response.json();
}

// Get notification history
export async function getNotificationHistory() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/notifications/history`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch notifications');
  return await response.json();
}

// Upload image file
export async function uploadImage(file) {
  const token = localStorage.getItem('adminToken');
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/admin/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload image');
  }
  return await response.json();
}

// List uploaded images
export async function listUploads() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/uploads`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch uploads');
  return await response.json();
}

// Delete uploaded image
export async function deleteUpload(filename) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/uploads/${filename}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to delete upload');
  return await response.json();
}

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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/specials`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to fetch specials');
  return await response.json();
}

// Create/Post a special (admin) - auto sends notification
export async function createSpecial(special) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/specials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/specials/${specialId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(update)
  });

  if (!response.ok) throw new Error('Failed to update special');
  return await response.json();
}

// Delete a special (admin)
export async function deleteSpecial(specialId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/specials/${specialId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) throw new Error('Failed to delete special');
  return await response.json();
}

// Resend notification for a special (admin)
export async function resendSpecialNotification(specialId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/specials/${specialId}/notify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/social-links`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch social links');
  return await response.json();
}

// Create social link
export async function createSocialLink(link) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/social-links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(link)
  });
  if (!response.ok) throw new Error('Failed to create social link');
  return await response.json();
}

// Update social link
export async function updateSocialLink(linkId, update) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/social-links/${linkId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update social link');
  return await response.json();
}

// Delete social link
export async function deleteSocialLink(linkId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/social-links/${linkId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/instagram-posts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch Instagram posts');
  return await response.json();
}

// Create Instagram post
export async function createInstagramPost(post) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/instagram-posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(post)
  });
  if (!response.ok) throw new Error('Failed to create Instagram post');
  return await response.json();
}

// Update Instagram post
export async function updateInstagramPost(postId, update) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/instagram-posts/${postId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update Instagram post');
  return await response.json();
}

// Delete Instagram post
export async function deleteInstagramPost(postId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/instagram-posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
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
export async function getCheckInCount(locationSlug) {
  try {
    const response = await fetch(`${API_URL}/checkin/count/${locationSlug}`);
    if (!response.ok) throw new Error('Failed to get count');
    return await response.json();
  } catch (error) {
    console.error('Error fetching check-in count:', error);
    return { count: 0 };
  }
}


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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/gallery`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch gallery');
  return await response.json();
}

// Create gallery item (admin)
export async function createGalleryItem(item) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/gallery`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/gallery/${itemId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update gallery item');
  return await response.json();
}

// Delete gallery item (admin)
export async function deleteGalleryItem(itemId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/gallery/${itemId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
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
export async function getAdminHomepageContent() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/homepage/content`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch homepage content');
  return await response.json();
}

// Update homepage content (admin)
export async function updateHomepageContent(update) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/homepage/content`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update homepage content');
  return await response.json();
}

// Check if user is admin
export function isAdminLoggedIn() {
  const token = localStorage.getItem('adminToken');
  return !!token;
}

// Verify admin token is still valid
export async function verifyAdminToken() {
  const token = localStorage.getItem('adminToken');
  if (!token) return false;
  
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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


// ==================== DJ PROFILE API ====================

// Register a new DJ
export async function registerDJ(profile) {
  const response = await fetch(`${API_URL}/dj/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  });
  if (!response.ok) throw new Error('Failed to register DJ');
  return await response.json();
}

// Get all DJ profiles
export async function getAllDJProfiles() {
  const response = await fetch(`${API_URL}/dj/profiles`);
  if (!response.ok) throw new Error('Failed to fetch DJ profiles');
  return await response.json();
}

// Get DJ profile by ID
export async function getDJProfile(djId) {
  const response = await fetch(`${API_URL}/dj/profile/${djId}`);
  if (!response.ok) throw new Error('Failed to fetch DJ profile');
  return await response.json();
}

// Update DJ profile
export async function updateDJProfile(djId, update) {
  const response = await fetch(`${API_URL}/dj/profile/${djId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error('Failed to update DJ profile');
  return await response.json();
}

// DJ check-in at location
export async function djCheckin(djId, locationSlug) {
  const response = await fetch(`${API_URL}/dj/checkin/${djId}?location_slug=${locationSlug}`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to check in DJ');
  return await response.json();
}

// DJ check-out
export async function djCheckout(djId) {
  const response = await fetch(`${API_URL}/dj/checkout/${djId}`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to check out DJ');
  return await response.json();
}

// Get DJ currently at location
export async function getDJAtLocation(locationSlug) {
  const response = await fetch(`${API_URL}/dj/at-location/${locationSlug}`);
  if (!response.ok) return null;
  const data = await response.json();
  return data;
}


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
export async function getPaymentMethods() {
  const response = await fetch(`${API_URL}/payment/methods`);
  if (!response.ok) throw new Error('Failed to fetch payment methods');
  return await response.json();
}

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
export async function createStripeEventCheckout(packageId, quantity = 1, userId = null) {
  const originUrl = window.location.origin;
  let url = `${API_URL}/stripe/events/checkout?package_id=${packageId}&quantity=${quantity}&origin_url=${encodeURIComponent(originUrl)}`;
  if (userId) url += `&user_id=${userId}`;
  
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

export async function updateDrinkStatus(orderId, status) {
  const response = await fetch(`${API_URL}/social/drinks/${orderId}/status?status=${status}`, {
    method: 'PUT'
  });
  if (!response.ok) throw new Error('Failed to update drink status');
  return await response.json();
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
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create profile');
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
export async function spendTokens(userId, amount) {
  const response = await fetch(`${API_URL}/user/tokens/spend/${userId}?amount=${amount}`, {
    method: 'POST'
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to spend tokens');
  }
  return await response.json();
}

// Admin: Gift tokens
export async function adminGiftTokens(userId, tokens, message = null) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/tokens/gift`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/users`, {
    headers: { 'Authorization': `Bearer ${token}` }
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
export async function getUserPosts(userId) {
  const response = await fetch(`${API_URL}/user/history/posts/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch posts');
  return await response.json();
}

// Get user's drink history
export async function getUserDrinkHistory(userId) {
  const response = await fetch(`${API_URL}/user/history/drinks/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch drinks');
  return await response.json();
}

// Get user's tip history
export async function getUserTipHistory(userId) {
  const response = await fetch(`${API_URL}/user/history/tips/${userId}`);
  if (!response.ok) throw new Error('Failed to fetch tips');
  return await response.json();
}


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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/users/role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/cashouts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch cashouts');
  return await response.json();
}

// Admin: Process cashout request
export async function adminProcessCashout(cashoutId, status) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/cashouts/${cashoutId}?status=${status}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/locations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch locations');
  return await response.json();
}

// Create location (admin)
export async function adminCreateLocation(location) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/locations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/locations/${locationId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/locations/${locationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete location');
  }
  return await response.json();
}

// Reorder locations (admin)
export async function adminReorderLocations(order) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/locations/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(order)
  });
  if (!response.ok) throw new Error('Failed to reorder locations');
  return await response.json();
}


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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/events`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch events');
  return await response.json();
}

// Create event (admin)
export async function adminCreateEvent(event) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/events/${eventId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/gallery-submissions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch gallery submissions');
  return await response.json();
}

// Delete gallery submission (admin)
export async function adminDeleteGallerySubmission(submissionId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/gallery-submissions/${submissionId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete submission');
  }
  return await response.json();
}
