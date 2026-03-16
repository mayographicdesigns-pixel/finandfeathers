import React from 'react';
import { Wifi, WifiOff, CloudOff, Cloud, Loader2 } from 'lucide-react';
import { useBackgroundSync } from '../services/backgroundSync';

/**
 * Offline Indicator Component
 * 
 * Shows network status and pending offline posts count.
 * Appears when offline or when there are pending posts.
 */
const OfflineIndicator = () => {
  const { pendingCount, isOnline, syncStatus } = useBackgroundSync();

  // Don't show if online and no pending posts
  if (isOnline && pendingCount === 0 && syncStatus === 'idle') {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className={`px-4 py-2 text-center text-sm font-medium transition-colors ${
        isOnline 
          ? 'bg-amber-600 text-white' 
          : 'bg-red-600 text-white'
      }`}>
        <div className="flex items-center justify-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span>You're offline</span>
              {pendingCount > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {pendingCount} post{pendingCount !== 1 ? 's' : ''} queued
                </span>
              )}
            </>
          ) : syncStatus === 'syncing' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Syncing {pendingCount} post{pendingCount !== 1 ? 's' : ''}...</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <Cloud className="w-4 h-4" />
              <span>Syncing queued posts...</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4" />
              <span>Back online</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
