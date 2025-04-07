// src/pages/ClassesPage.jsx

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function ClassesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // Use the top pick result and warning passed from LoadingPage
  const { results, warning } = location.state || {};
  const topPick = results && results.length > 0 ? results[0] : null;

  return (
    <div className="relative w-screen h-screen m-0 p-0 overflow-hidden font-sans">
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        style={{
          backgroundImage: "url('/hammocks.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.5 }}
      >
      {/* Note about library equipment */}
      <div className="absolute top-25 left-4 max-w-xs z-50">
        <div className="relative bg-orange-500 text-white text-xs px-4 py-3 rounded-[30px] shadow-md">
          <p className="leading-snug text-center italic">
            Note: If you need any chargers, whiteboard markers, or other equipment, please borrow them from the library.
          </p>
          <div className="absolute -bottom-1 left-1 w-4 h-4 bg-orange-500 rounded-tr-full transform rotate-95"></div>
        </div>
      </div>

        {/* Black banner container starting at 200px from the top */}
        <div
          style={{
            position: "absolute",
            top: "200px",
            bottom: "210px",
            left: 0,
            width: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            padding: "20px",
          }}
        >

          {/* Room Title */}
          <h1 className="text-center text-9xl font-light text-white mt-3 mb-8">
            {topPick ? `${topPick.building} ${topPick.roomName}` : "No Classroom Selected"}
          </h1>

          {/* Thin Orange Line */}
          <div className="w-[110vw] h-1 bg-orange-400 my-6 -ml-[5vw]" />


          {topPick && (
          <div className="mt-6 flex flex-row flex-wrap justify-center items-center gap-x-6 gap-y-4 px-4">
            <div className="flex items-center">
              <span className="text-s text-white">
                Capacity: {topPick.capacity}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-m text-white">
                Whiteboards: {topPick.whiteboards || "N/A"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-s text-white">
                Outlets: {topPick.outlets || "N/A"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-s text-white">
                Amenities: WiFi, Air Conditioning, Projector
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-s text-white">
                Hours: 7:00 AM – 10:00 PM (Business Days)
              </span>
            </div>
          </div>
        )}

          {/* Thin Orange Line */}
          <div className="w-[110vw] h-1 bg-orange-400 my-6 -ml-[5vw]" />


          {/* Warning message if applicable */}
          {warning && (
            <p className="text-center text-red-400 mt-4 font-semibold">
              {warning}
            </p>
          )}


          {/* Navigation Buttons */}
          <div className="flex justify-center gap-5 mt-6">
            <button
              onClick={() => navigate("/")}
              className="bg-orange-500 text-white text-xs uppercase px-4 py-2 rounded-full font-bold hover:bg-orange-600 transition-colors max-w-[320px] text-center"
            >
              Not what you were looking for?
            </button>
            <button
              onClick={() => navigate("/map")}
              className="bg-orange-500 text-white text-xs uppercase px-4 py-2 rounded-full font-bold hover:bg-orange-600 transition-colors max-w-[320px] text-center"
            >
              Need help finding your way there?
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
