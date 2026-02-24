/**
 * Background Sync Service for Offline Posts
 * 
 * Queues posts when offline and syncs them when back online.
 * Uses IndexedDB for persistent storage.
 */

import React from 'react';

const DB_NAME = 'fin-feathers-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-posts';

class BackgroundSyncService {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.listeners = new Set();
    
    // Listen for online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  // Initialize IndexedDB
  async init() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  // Add a post to the offline queue
  async queuePost(postData) {
    await this.init();

    const pendingPost = {
      ...postData,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(pendingPost);

      request.onsuccess = () => {
        console.log('[BackgroundSync] Post queued:', request.result);
        this.notifyListeners('queued', pendingPost);
        resolve(request.result);
        
        // Try to sync immediately if online
        if (this.isOnline) {
          this.syncPendingPosts();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Get all pending posts
  async getPendingPosts() {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get pending posts count
  async getPendingCount() {
    const posts = await this.getPendingPosts();
    return posts.filter(p => p.status === 'pending').length;
  }

  // Update post status
  async updatePostStatus(id, status, error = null) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const post = getRequest.result;
        if (post) {
          post.status = status;
          post.lastError = error;
          post.lastAttempt = Date.now();
          if (status === 'failed') post.retries++;
          
          const updateRequest = store.put(post);
          updateRequest.onsuccess = () => resolve(post);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Post not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Delete a post from queue
  async deletePost(id) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.notifyListeners('deleted', { id });
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Sync all pending posts
  async syncPendingPosts() {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    this.notifyListeners('sync-start', null);
    
    try {
      const pendingPosts = await this.getPendingPosts();
      const postsToSync = pendingPosts.filter(p => p.status === 'pending' && p.retries < 3);
      
      console.log(`[BackgroundSync] Syncing ${postsToSync.length} posts`);
      
      for (const post of postsToSync) {
        try {
          await this.syncSinglePost(post);
          await this.deletePost(post.id);
          this.notifyListeners('synced', post);
        } catch (error) {
          console.error('[BackgroundSync] Failed to sync post:', error);
          await this.updatePostStatus(post.id, 'failed', error.message);
          this.notifyListeners('sync-failed', { post, error: error.message });
        }
      }
      
      this.notifyListeners('sync-complete', { synced: postsToSync.length });
    } catch (error) {
      console.error('[BackgroundSync] Sync error:', error);
      this.notifyListeners('sync-error', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync a single post to the server
  async syncSinglePost(post) {
    const API_URL = process.env.REACT_APP_BACKEND_URL;
    
    let endpoint, method, body;
    
    switch (post.type) {
      case 'social-post':
        endpoint = `${API_URL}/api/social-posts`;
        method = 'POST';
        body = {
          checkin_id: post.checkin_id,
          location_slug: post.location_slug,
          content: post.content,
          image_url: post.image_url
        };
        break;
        
      case 'dm':
        endpoint = `${API_URL}/api/dm/send`;
        method = 'POST';
        body = {
          from_checkin_id: post.from_checkin_id,
          to_checkin_id: post.to_checkin_id,
          content: post.content
        };
        break;
        
      case 'dj-tip':
        endpoint = `${API_URL}/api/dj-tips`;
        method = 'POST';
        body = {
          from_checkin_id: post.from_checkin_id,
          location_slug: post.location_slug,
          amount: post.amount,
          message: post.message
        };
        break;
        
      default:
        throw new Error(`Unknown post type: ${post.type}`);
    }
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    
    return response.json();
  }

  // Handle coming online
  handleOnline() {
    console.log('[BackgroundSync] Back online');
    this.isOnline = true;
    this.notifyListeners('online', null);
    this.syncPendingPosts();
  }

  // Handle going offline
  handleOffline() {
    console.log('[BackgroundSync] Gone offline');
    this.isOnline = false;
    this.notifyListeners('offline', null);
  }

  // Add event listener
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('[BackgroundSync] Listener error:', error);
      }
    });
  }

  // Check if we're online
  getOnlineStatus() {
    return this.isOnline;
  }
}

// Singleton instance
const backgroundSync = new BackgroundSyncService();

export default backgroundSync;

// React hook for using background sync
export const useBackgroundSync = () => {
  const [pendingCount, setPendingCount] = React.useState(0);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = React.useState('idle');

  React.useEffect(() => {
    const updateCount = async () => {
      const count = await backgroundSync.getPendingCount();
      setPendingCount(count);
    };

    const handleEvent = (event, data) => {
      switch (event) {
        case 'online':
          setIsOnline(true);
          break;
        case 'offline':
          setIsOnline(false);
          break;
        case 'sync-start':
          setSyncStatus('syncing');
          break;
        case 'sync-complete':
          setSyncStatus('idle');
          updateCount();
          break;
        case 'queued':
        case 'synced':
        case 'deleted':
          updateCount();
          break;
        default:
          break;
      }
    };

    updateCount();
    const unsubscribe = backgroundSync.addListener(handleEvent);

    return unsubscribe;
  }, []);

  return {
    pendingCount,
    isOnline,
    syncStatus,
    queuePost: (data) => backgroundSync.queuePost(data),
    syncNow: () => backgroundSync.syncPendingPosts(),
    getPendingPosts: () => backgroundSync.getPendingPosts()
  };
};
