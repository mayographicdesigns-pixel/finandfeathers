import React, { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from './ui/button';

/**
 * PWA Update Prompt Component
 * 
 * Detects when a new version of the app is available and prompts
 * the user to refresh. Can also auto-refresh if configured.
 */
const UpdatePrompt = ({ autoUpdate = false }) => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [newVersion, setNewVersion] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration = null;

    const checkForUpdates = async () => {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Check for updates immediately
          registration.update();
          
          // Listen for new service worker installing
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('[UpdatePrompt] New version available');
                  if (autoUpdate) {
                    // Auto update - refresh immediately
                    handleUpdate();
                  } else {
                    setShowUpdatePrompt(true);
                  }
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('[UpdatePrompt] Error checking for updates:', error);
      }
    };

    // Listen for messages from service worker
    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[UpdatePrompt] SW updated to version:', event.data.version);
        setNewVersion(event.data.version);
        if (autoUpdate) {
          // Auto refresh on update
          window.location.reload();
        } else {
          setShowUpdatePrompt(true);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    // Check for updates on page load
    checkForUpdates();

    // Check for updates every 5 minutes
    const intervalId = setInterval(() => {
      if (registration) {
        registration.update();
      }
    }, 5 * 60 * 1000);

    // Also check when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && registration) {
        registration.update();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoUpdate]);

  const handleUpdate = async () => {
    setUpdating(true);
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Refresh the page after a short delay to allow SW to activate
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('[UpdatePrompt] Error updating:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 border border-red-600/50 rounded-xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">Update Available</h3>
            <p className="text-slate-400 text-xs mt-1">
              A new version of Fin & Feathers is ready.
              {newVersion && <span className="text-slate-500"> (v{newVersion})</span>}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleUpdate}
                disabled={updating}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                data-testid="update-now-btn"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Update Now
                  </>
                )}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white text-xs h-8"
                data-testid="dismiss-update-btn"
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-slate-500 hover:text-white p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
