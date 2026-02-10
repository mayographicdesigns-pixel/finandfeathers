import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import LinkTreeHomePage from "./pages/LinkTreeHomePage";
import LocationsPage from "./pages/LocationsPage";
import MenuPage from "./pages/MenuPage";
import { Toaster } from "./components/ui/toaster";

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
    </div>
  );
}

export default App;
