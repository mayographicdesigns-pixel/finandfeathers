const BACKEND_URL = window.location.origin;
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
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_URL}/admin/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
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
    const token = localStorage.getItem('adminToken');
    const response = await fetch(`${API_URL}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
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
export async function getDJSchedulesForLocation(locationSlug) {
  try {
    const response = await fetch(`${API_URL}/dj/schedules/location/${locationSlug}`);
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

// Delete contact (soft delete)
export async function deleteContact(contactId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/contacts/${contactId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
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
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/page-content/${pageKey}/${sectionKey}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
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

  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data.detail || 'Failed to upload image');
  }
  return data;
}

// List uploaded images
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
export async function getStaffList() {
  const response = await fetch(`${API_URL}/staff/list`);
  if (!response.ok) throw new Error('Failed to fetch staff');
  return await response.json();
}

// Staff: Request cashout (min $20, 80% rate)
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


// ==================== ADMIN SOCIAL POSTS API ====================

// Get all social posts (admin)
export async function adminGetAllSocialPosts() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/social-posts`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch social posts');
  return await response.json();
}

// Delete social post (admin)
export async function adminDeleteSocialPost(postId) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/social-posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete post');
  }
  return await response.json();
}

// Cleanup old posts (admin)
export async function adminCleanupOldPosts() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/social-posts/cleanup/old`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to cleanup posts');
  }
  return await response.json();
}

// Delete user (admin)
export async function getJobApplications() {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/careers/applications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch applications');
  return await response.json();
}

export async function updateApplicationStatus(id, status) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/careers/applications/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update application');
  return await response.json();
}

export async function deleteApplication(id) {
  const token = localStorage.getItem('adminToken');
  const response = await fetch(`${API_URL}/admin/careers/applications/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete application');
  return await response.json();
}
