// src/pages/HomePage.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BannerSpots from "../components/BannerSpots";
import StudySpotsGallery from "../components/StudySpotsGallery";
import WeatherBasedRecs from "../components/WeatherBasedRecs"; // Import the weather-based recommendations

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="relative w-screen h-screen"
      style={{
        backgroundImage: "url('/umvillage.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.7 }}
    >
      {/* Black overlay for study spots */}
      <div className="absolute top-0 left-0 w-3/8 h-full bg-black/55">
        <StudySpotsGallery />
      </div>

      {/* Logo in top-left corner */}
      <div className="absolute top-0 left-0 z-10 m-4">
        <img src="/logo.png" alt="Site Logo" className="h-auto w-40" />
      </div>

      {/* Black bar with Banner at top (unchanged) */}
      <div className="absolute top-20 left-3/8 w-5/8 bg-black/65 py-1 flex items-center justify-start">
        <BannerSpots />
      </div>

      {/* NEW BLACK OVERLAY (Filter Form or Additional Content) */}
      <div
        className="absolute z-0 flex w-3/9 flex-col items-center justify-center"
        style={{
          height: "489px",
          left: "52.5%",
          top: "170px",
          backgroundColor: "rgba(0, 0, 0, 0.55)",
        }}
      >
        {/* Weather-based recommendations component integrated here */}
        <WeatherBasedRecs />
      </div>
    </motion.div>
  );
}
