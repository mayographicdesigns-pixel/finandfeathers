import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Service Worker Registration with Update Detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('[App] ServiceWorker registered:', registration.scope);

      // Check for updates on registration
      registration.update();

      // Listen for new service worker installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[App] New service worker installing...');
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('[App] Service worker state:', newWorker.state);
            
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[App] New version available - will prompt user');
              } else {
                // First install
                console.log('[App] Content cached for offline use');
              }
            }
          });
        }
      });

      // Handle controller change (when new SW takes over)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[App] New service worker activated');
        // The UpdatePrompt component handles the actual refresh
      });

    } catch (error) {
      console.error('[App] ServiceWorker registration failed:', error);
    }
  });
}
