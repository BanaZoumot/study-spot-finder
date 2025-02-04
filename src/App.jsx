import { Routes, Route } from "react-router-dom";
import DisplayClassrooms from "./pages/DisplayClassrooms";
import "./styles/global.css";

export default function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<DisplayClassrooms />} />
      </Routes>
    </div>
  );
}


