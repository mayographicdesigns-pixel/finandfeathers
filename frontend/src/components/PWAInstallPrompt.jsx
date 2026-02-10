import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleClose = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-gradient-to-r from-red-900 to-slate-900 border border-red-600/50 rounded-lg shadow-2xl p-4">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Download className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-bold text-sm mb-1">
              Install Fin & Feathers App
            </h3>
            <p className="text-slate-300 text-xs mb-3">
              Get quick access to our menu, locations, and daily specials on your home screen!
            </p>
            <Button
              onClick={handleInstallClick}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Install Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
