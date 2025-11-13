import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import "./styles/global.css";
import App from "./App.jsx";
import Home from "./Home.jsx";
import CreatePlanPage from "./pages/CreatePlanPage.jsx";
<<<<<<< HEAD
import StudySessionPage from "./pages/StudySessionPage.jsx";
=======
>>>>>>> 9ffb38d2d14cd560232ea4fd2fbcec3018ae6079

const Root = () => (
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai" element={<App />} />
        <Route path="/plan/new" element={<CreatePlanPage />} />
<<<<<<< HEAD
        <Route path="/sessions" element={<StudySessionPage />} />
=======
>>>>>>> 9ffb38d2d14cd560232ea4fd2fbcec3018ae6079
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

createRoot(document.getElementById("root")).render(<Root />);
