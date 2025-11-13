import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import "./styles/global.css";
import App from "./App.jsx";
import Home from "./Home.jsx";
import CreatePlanPage from "./pages/CreatePlanPage.jsx";
import StudySessionPage from "./pages/StudySessionPage.jsx";

const Root = () => (
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai" element={<App />} />
        <Route path="/plan/new" element={<CreatePlanPage />} />
        <Route path="/sessions" element={<StudySessionPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

createRoot(document.getElementById("root")).render(<Root />);
