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
        {/* Black banner container starting at 200px from the top */}
        <div
          style={{
            position: "absolute",
            top: "200px",
            left: 0,
            width: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            padding: "20px",
          }}
        >
          {/* Room Title */}
          <h1 className="text-center text-9xl font-light text-white">
            {topPick ? `${topPick.building} ${topPick.roomName}` : "No Classroom Selected"}
          </h1>

          {/* If we have a valid top pick, display details */}
          {topPick && (
            <div className="mt-6 flex flex-col items-start space-y-4 px-4">
              <div className="flex items-center">
                <img
                  src="/icons/capacity-icon.png"
                  alt="Capacity"
                  className="w-6 h-6 mr-2"
                />
                <span className="text-xl text-white">
                  Capacity: {topPick.capacity}
                </span>
              </div>
              <div className="flex items-center">
                <img
                  src="/icons/whiteboard-icon.png"
                  alt="Whiteboards"
                  className="w-6 h-6 mr-2"
                />
                <span className="text-xl text-white">
                  Whiteboards: {topPick.whiteboards || "N/A"}
                </span>
              </div>
              <div className="flex items-center">
                <img
                  src="/icons/outlet-icon.png"
                  alt="Outlets"
                  className="w-6 h-6 mr-2"
                />
                <span className="text-xl text-white">
                  Outlets: {topPick.outlets || "N/A"}
                </span>
              </div>
              <div className="flex items-center">
                <img
                  src="/icons/amenity-icon.png"
                  alt="Amenities"
                  className="w-6 h-6 mr-2"
                />
                <span className="text-xl text-white">
                  Amenities: WiFi, Air Conditioning, Projector
                </span>
              </div>
              <div className="flex items-center">
                <img
                  src="/icons/hours-icon.png"
                  alt="Hours of Operation"
                  className="w-6 h-6 mr-2"
                />
                <span className="text-xl text-white">
                  Hours: 7:00 AM – 10:00 PM (Business Days)
                </span>
              </div>
            </div>
          )}

          {/* Warning message if applicable */}
          {warning && (
            <p className="text-center text-red-400 mt-4 font-semibold">
              {warning}
            </p>
          )}

          {/* Note about library equipment */}
          <p className="text-center text-white mt-6 italic">
            Note: If you need any chargers, whiteboard markers, or other equipment, 
            please borrow them from the library.
          </p>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => navigate("/")}
              className="bg-orange-500 text-white px-4 py-2 rounded font-semibold hover:bg-orange-600 transition-colors"
            >
              Doesn't seem right for you?
            </button>
            <button
              onClick={() => navigate("/map")}
              className="bg-orange-500 text-white px-4 py-2 rounded font-semibold hover:bg-orange-600 transition-colors"
            >
              Need help finding your way there?
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
