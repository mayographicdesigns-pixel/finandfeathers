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