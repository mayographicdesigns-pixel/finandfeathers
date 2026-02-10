import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LinkTreeHomePage from "./pages/LinkTreeHomePage";
import LocationsPage from "./pages/LocationsPage";
import MenuPage from "./pages/MenuPage";
import { Toaster } from "./components/ui/toaster";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LinkTreeHomePage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/menu" element={<MenuPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
      <PWAInstallPrompt />
    </div>
  );
}

export default App;
