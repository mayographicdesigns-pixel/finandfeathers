import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import LinkTreeHomePage from "./pages/LinkTreeHomePage";
import LocationsPage from "./pages/LocationsPage";
import LocationDetailPage from "./pages/LocationDetailPage";
import MenuPage from "./pages/MenuPage";
import AdminPage from "./pages/AdminPage";
import CheckInPage from "./pages/CheckInPage";
import GalleryPage from "./pages/GalleryPage";
import MyAccountPage from "./pages/MyAccountPage";
import MerchandisePage from "./pages/MerchandisePage";
import EventsPage from "./pages/EventsPage";
import AuthCallback from "./components/AuthCallback";
import { Toaster } from "./components/ui/toaster";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import UpdatePrompt from "./components/UpdatePrompt";
import OfflineIndicator from "./components/OfflineIndicator";

// Router component that handles OAuth callback detection
function AppRouter() {
  const location = useLocation();
  
  // CRITICAL: Check URL fragment (not query params) for session_id synchronously
  // This prevents race conditions by processing OAuth callback FIRST
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/" element={<LinkTreeHomePage />} />
      <Route path="/locations" element={<LocationsPage />} />
      <Route path="/locations/:slug" element={<LocationDetailPage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/merch" element={<MerchandisePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/checkin" element={<CheckInPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/account" element={<MyAccountPage />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster />
      <PWAInstallPrompt />
      <UpdatePrompt autoUpdate={false} />
    </div>
  );
}

export default App;
