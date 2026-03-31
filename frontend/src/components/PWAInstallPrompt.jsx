import React, { useState, useEffect } from 'react';
import { X, Download, Share, Smartphone, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

const PWAInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    
    if (standalone) {
      // App is installed — show refresh button after short delay
      setTimeout(() => setShowPrompt(true), 1000);
      return;
    }

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 12) return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (mobile) {
        setTimeout(() => setShowPrompt(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (iOS && mobile) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Clear service worker caches
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && registration.active) {
          registration.active.postMessage({ type: 'CLEAR_CACHE' });
        }
        // Also clear caches directly from the window context
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      // Small delay then hard reload
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    } catch {
      window.location.reload(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (!isStandalone) {
      localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    }
  };

  // Installed app: show compact refresh button
  if (isStandalone && showPrompt) {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-[100]" style={{ animation: 'slideUp 0.4s ease-out' }}>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-red-600 hover:bg-red-700 text-white rounded-full h-12 px-5 shadow-xl shadow-red-900/40 border border-red-500/30"
            data-testid="pwa-refresh-btn"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </>
    );
  }

  // Not installed: show install prompt (mobile only)
  if (!showPrompt || isStandalone || !isMobile) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[100] safe-area-inset-bottom">
        <div 
          className="bg-gradient-to-t from-black via-slate-900 to-transparent pt-8 pb-4 px-4"
          style={{ animation: 'slideUp 0.4s ease-out' }}
        >
          <div className="bg-slate-900/95 backdrop-blur-lg rounded-2xl border border-red-600/40 shadow-2xl shadow-red-900/30 p-4 mx-auto max-w-md">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-black shadow-lg border-2 border-slate-700">
                <img 
                  src="/logo192.png" 
                  alt="Fin & Feathers" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">Fin & Feathers</h3>
                    <p className="text-slate-400 text-xs">Get the full app experience</p>
                  </div>
                  <button 
                    onClick={handleDismiss} 
                    className="text-slate-500 hover:text-white p-1.5 -mt-1 -mr-1"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {isIOS ? (
                  <div className="mt-3">
                    <p className="text-slate-300 text-sm flex items-center gap-2 flex-wrap">
                      <span>Tap</span>
                      <span className="inline-flex items-center gap-1 bg-slate-800 px-2 py-1 rounded">
                        <Share className="w-4 h-4 text-blue-400" />
                      </span>
                      <span>then</span>
                      <span className="text-white font-medium">"Add to Home Screen"</span>
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={handleInstall}
                    className="mt-3 bg-red-600 hover:bg-red-700 text-white w-full h-11 text-base font-semibold"
                    data-testid="install-app-btn"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Install App
                  </Button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-slate-800">
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Faster access
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-400 text-xs">Push notifications</span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-400 text-xs">Works offline</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </>
  );
};

export default PWAInstallPrompt;
