import React, { useState, useEffect } from 'react';
import { RefreshCw, X, Sparkles, Bug, Zap, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { APP_VERSION, CHANGELOG, getChangelogsSince, hasCriticalUpdate } from '../config/changelog';

/**
 * PWA Update Prompt Component with Changelog
 * 
 * Features:
 * - Detects new app versions
 * - Shows changelog popup with what's new
 * - Force-refresh for critical updates
 * - Dismissable for non-critical updates
 */
const UpdatePrompt = ({ autoUpdate = false }) => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [newVersion, setNewVersion] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [changelogs, setChangelogs] = useState([]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let registration = null;

    const checkForUpdates = async () => {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          registration.update();
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[UpdatePrompt] New version available');
                  handleNewVersionDetected(APP_VERSION);
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('[UpdatePrompt] Error checking for updates:', error);
      }
    };

    const handleSWMessage = (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[UpdatePrompt] SW updated to version:', event.data.version);
        handleNewVersionDetected(event.data.version);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    checkForUpdates();

    const intervalId = setInterval(() => {
      if (registration) registration.update();
    }, 5 * 60 * 1000);

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

  const handleNewVersionDetected = (version) => {
    const lastVersion = localStorage.getItem('ff_app_version') || '1.0.0';
    const critical = hasCriticalUpdate(lastVersion);
    const changes = getChangelogsSince(lastVersion);
    
    setNewVersion(version);
    setIsCritical(critical);
    setChangelogs(changes);
    
    if (critical) {
      // Critical update - force refresh after short delay
      console.log('[UpdatePrompt] Critical update detected - forcing refresh');
      setShowUpdatePrompt(true);
      setTimeout(() => {
        handleUpdate();
      }, 3000); // Give user 3 seconds to see the message
    } else if (autoUpdate) {
      handleUpdate();
    } else {
      setShowUpdatePrompt(true);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    
    try {
      // Save the new version
      localStorage.setItem('ff_app_version', newVersion || APP_VERSION);
      
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('[UpdatePrompt] Error updating:', error);
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    if (isCritical) return; // Can't dismiss critical updates
    setShowUpdatePrompt(false);
    setShowChangelog(false);
  };

  const handleViewChangelog = () => {
    setShowChangelog(true);
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'feature': return <Sparkles className="w-3 h-3 text-green-400" />;
      case 'bugfix': return <Bug className="w-3 h-3 text-red-400" />;
      case 'improvement': return <Zap className="w-3 h-3 text-blue-400" />;
      default: return <Sparkles className="w-3 h-3 text-slate-400" />;
    }
  };

  if (!showUpdatePrompt) return null;

  // Changelog Modal
  if (showChangelog) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-lg">What's New</h2>
                <p className="text-red-200 text-sm">Version {newVersion || APP_VERSION}</p>
              </div>
              {!isCritical && (
                <button onClick={handleDismiss} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {/* Changelog Content */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            {changelogs.length > 0 ? (
              changelogs.map(([version, data]) => (
                <div key={version} className="mb-6 last:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-semibold">v{version}</span>
                    <span className="text-slate-500 text-xs">{data.date}</span>
                    {data.isCritical && (
                      <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">Critical</span>
                    )}
                  </div>
                  <h3 className="text-slate-300 text-sm mb-2">{data.title}</h3>
                  <ul className="space-y-1.5">
                    {data.changes.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-400 text-sm">
                        {getChangeIcon(change.type)}
                        <span>{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400">Bug fixes and performance improvements</p>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-slate-700 p-4">
            {isCritical ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Critical Update Required</span>
                </div>
                <p className="text-slate-400 text-xs mb-3">Updating automatically...</p>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-red-600 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                data-testid="changelog-update-btn"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Update Now
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Compact Update Toast
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className={`rounded-xl shadow-2xl p-4 ${isCritical ? 'bg-red-900 border border-red-600' : 'bg-slate-900 border border-red-600/50'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCritical ? 'bg-red-600' : 'bg-red-600/20'}`}>
            {isCritical ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <RefreshCw className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">
              {isCritical ? 'Critical Update Required' : 'Update Available'}
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              {isCritical 
                ? 'This update is required. Refreshing automatically...'
                : `A new version of Fin & Feathers is ready.`
              }
              {newVersion && <span className="text-slate-500"> (v{newVersion})</span>}
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleViewChangelog}
                size="sm"
                variant="outline"
                className="text-xs h-8 border-slate-600 text-slate-300 hover:text-white"
                data-testid="view-changelog-btn"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                What's New
              </Button>
              {!isCritical && (
                <>
                  <Button
                    onClick={handleUpdate}
                    disabled={updating}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                    data-testid="update-now-btn"
                  >
                    {updating ? 'Updating...' : 'Update'}
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
                </>
              )}
            </div>
          </div>
          {!isCritical && (
            <button onClick={handleDismiss} className="text-slate-500 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
