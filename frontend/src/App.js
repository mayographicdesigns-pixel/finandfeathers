import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LinkTreeHomePage from "./pages/LinkTreeHomePage";
import LocationsPage from "./pages/LocationsPage";
import LocationDetailPage from "./pages/LocationDetailPage";
import MenuPage from "./pages/MenuPage";
import AdminPage from "./pages/AdminPage";
import CheckInPage from "./pages/CheckInPage";
import GalleryPage from "./pages/GalleryPage";
import MyAccountPage from "./pages/MyAccountPage";
import { Toaster } from "./components/ui/toaster";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LinkTreeHomePage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/locations/:slug" element={<LocationDetailPage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/checkin" element={<CheckInPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/account" element={<MyAccountPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      <PWAInstallPrompt />
    </div>
  );
}

export default App;
