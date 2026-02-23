import React, { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from './ui/button';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed/standalone
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);
    
    if (standalone) return; // Don't show if already installed

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Check if dismissed recently (within 24 hours)
    const dismissedAt = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedAt) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) return;
    }

    // For Android/Chrome - listen for beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a delay on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS - show custom prompt after delay
    if (iOS && window.innerWidth <= 768) {
      setTimeout(() => setShowPrompt(true), 3000);
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

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-red-600/30 shadow-2xl shadow-red-900/20 p-4 mx-auto max-w-md">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-black border border-slate-700">
            <img src="/logo192.png" alt="Fin & Feathers" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">Get the App</h3>
              <button onClick={handleDismiss} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">
              Install Fin & Feathers for the best experience
            </p>
            
            {isIOS ? (
              <div className="mt-3 text-sm text-slate-300">
                <p className="flex items-center gap-2">
                  <span>Tap</span>
                  <Share className="w-4 h-4 text-blue-400" />
                  <span>then "Add to Home Screen"</span>
                </p>
              </div>
            ) : (
              <Button 
                onClick={handleInstall}
                className="mt-3 bg-red-600 hover:bg-red-700 text-white w-full"
                data-testid="install-app-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt;
