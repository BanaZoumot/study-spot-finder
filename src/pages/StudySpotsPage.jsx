// src/pages/StudySpotsPage.jsx

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function StudySpotsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, warning } = location.state || {};
  const { topPick, otherOptions } = results || { topPick: null, otherOptions: [] };

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
              Note: Need chargers or markers? Borrow them from the library!
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="absolute top-2 left-2 w-10 h-10">
          <button
            className="w-full h-full flex items-center justify-center focus:outline-none z-50 bg-white rounded-full"
            onClick={() => navigate(-2)}
            aria-label="Go Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="gray"
            >
              <path
                fillRule="evenodd"
                d="M12.293 15.707a1 1 0 010-1.414L8.414 10l3.879-3.879a1 1 0 10-1.414-1.414l-5 5a1 1 0 000 1.414l5 5a1 1 0 001.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Main Banner */}
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
          {/* Title */}
          <h1 className="text-center text-9xl font-light text-white mt-3 mb-8">
            {topPick ? topPick.name : "No Study Spot Selected"}
          </h1>

          {/* Orange Line */}
          <div className="w-[110vw] h-1 bg-orange-400 my-6 -ml-[5vw]" />

          {topPick && (
            <div className="mt-6 flex flex-row flex-wrap justify-center items-center gap-x-6 gap-y-4 px-4">
              <div className="text-s text-white">Description: {topPick.description}</div>
              <div className="text-s text-white">
                Building: {topPick.location?.building || "N/A"}
              </div>
              <div className="text-s text-white">
                Indoor: {topPick.indoor ? "Yes" : "No"}
              </div>
              <div className="text-s text-white">
                Whiteboard: {topPick.amenities?.whiteboard ? "Yes" : "No"}
              </div>
              <div className="text-s text-white">
                Power Outlets: {topPick.amenities?.powerOutlets || "N/A"}
              </div>
            </div>
          )}

          {/* Orange Line */}
          <div className="w-[110vw] h-1 bg-orange-400 my-6 -ml-[5vw]" />

          {/* Warning */}
          {warning && (
            <p className="text-center text-red-400 mt-4 font-semibold">
              {warning}
            </p>
          )}

          {/* Other Options */}
          {otherOptions && otherOptions.length > 0 && (
            <div className="mt-8 px-4 text-white">
              <h2 className="text-center text-2xl font-semibold mb-4">Other Study Spots</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {otherOptions.map((spot) => (
                  <div
                    key={spot.id}
                    className="bg-white text-black rounded-lg p-4 shadow-md"
                  >
                    <h3 className="text-xl font-bold mb-2">{spot.name}</h3>
                    <p className="mb-1">{spot.description}</p>
                    <p className="text-sm">
                      <strong>Building:</strong> {spot.location?.building || "N/A"}
                    </p>
                    <p className="text-sm">
                      <strong>Indoor:</strong> {spot.indoor ? "Yes" : "No"}
                    </p>
                    <p className="text-sm">
                      <strong>Whiteboard:</strong>{" "}
                      {spot.amenities?.whiteboard ? "Yes" : "No"}
                    </p>
                    <p className="text-sm">
                      <strong>Power Outlets:</strong>{" "}
                      {spot.amenities?.powerOutlets || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-5 mt-8">
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
