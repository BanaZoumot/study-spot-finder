// src/pages/LandingPage.jsx

import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="relative w-screen h-screen"
      style={{
        backgroundImage: "url('/umvillage.png')", // Replace with your background image
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/55"></div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* Top text: "ARE [U LOGO] LOOKING FOR A" */}
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-white text-3xl font-bold uppercase">ARE</h1>
          <img
            src="/umiamilogo.png" // Replace with your U logo path
            alt="U"
            className="h-8 w-auto"
          />
          <h1 className="text-white text-3xl font-bold uppercase">LOOKING FOR A</h1>
        </div>

        {/* Two buttons: ROOM or SPACE */}
        <div className="flex gap-8">
          <button
            className="bg-orange-500 text-white px-6 py-3 rounded font-semibold text-lg hover:bg-orange-600 transition-colors"
            onClick={() => navigate("/HomePage")} // We'll define "/room-home" below
          >
            ROOM
          </button>
          <button
            className="bg-orange-500 text-white px-6 py-3 rounded font-semibold text-lg hover:bg-orange-600 transition-colors"
            onClick={() => navigate("/SpaceHomePage")} // We'll define "/space-home" below
          >
            SPACE
          </button>
        </div>
      </div>
    </motion.div>
  );
}
