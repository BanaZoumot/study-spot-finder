// src/pages/LandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="relative w-screen h-screen"
      style={{
        backgroundImage: "url('/umvillage.png')", // Same background image; no fade-in animation
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/55"></div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* Top text: "ARE [U LOGO] LOOKING FOR A" */}
        <div className="flex items-center gap-2 mb-6">
          <h1
            className="text-4xl font-bold uppercase"
            style={{ color: "white" }}
          >
            ARE
          </h1>
          <img
            src="/umiamilogo.png"
            alt="U"
            className="h-11 w-auto"
          />
          <h1
            className="text-4xl font-bold uppercase"
            style={{ color: "white" }}
          >
            LOOKING FOR A
          </h1>
        </div>

        {/* Two buttons: ROOM or SPACE */}
        <div className="flex gap-8">
          <button
            className="bg-orange-500 text-white px-6 py-3 rounded font-semibold text-lg hover:bg-orange-600 transition-colors"
            onClick={() => navigate("/HomePage")}
          >
            ROOM
          </button>
          <button
            className="bg-orange-500 text-white px-6 py-3 rounded font-semibold text-lg hover:bg-orange-600 transition-colors"
            onClick={() => navigate("/SpaceHomePage")}
          >
            SPACE
          </button>
        </div>
      </div>
    </div>
  );
}
