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
