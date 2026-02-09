import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import MenuPage from "./pages/MenuPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MenuPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
