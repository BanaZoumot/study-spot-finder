// src/pages/StudySpots.jsx

import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

export default function StudySpots() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch study spots from Firestore
  useEffect(() => {
    async function fetchSpots() {
      try {
        const snapshot = await getDocs(collection(db, "studySpots"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSpots(data);
      } catch (error) {
        console.error("Error fetching study spots:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSpots();
  }, []);

  // Random spot function
  function handleRandomSpot() {
    if (spots.length === 0) return;
    const randomIndex = Math.floor(Math.random() * spots.length);
    const randomSpot = spots[randomIndex];
    alert(`Try studying at: ${randomSpot.name}`);
  }

  if (loading) {
    return (
      <p className="text-center mt-8 text-white">
        Loading study spots...
      </p>
    );
  }

  return (
    <motion.div
      className="relative w-screen h-screen"
      style={{
        backgroundImage: "url('/hammocks.png')", // Background image for the StudySpots page
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      {/* Black overlay banner */}
      <div className="absolute inset-0 bg-black/55"></div>

      <div className="relative z-10 max-w-5xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Public Study Spots
        </h2>

        {/* Optionally, you can add filtering UI here */}

        {/* Grid of study spots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className="bg-black/55 p-4 rounded shadow-sm"
            >
              <img
                src={spot.images && spot.images[0]}
                alt={spot.name}
                className="w-full h-48 object-cover rounded mb-2"
              />
              <h3 className="text-xl font-bold text-white">{spot.name}</h3>
              <p className="text-white mb-2">{spot.description}</p>
              <p className="text-white">
                <strong>Indoor:</strong> {spot.indoor ? "Yes" : "No"}
              </p>
              <p className="text-white">
                <strong>Outlets:</strong> {spot.outlets}
              </p>
              <p className="text-white">
                <strong>Busyness (Morning/Afternoon/Evening):</strong>{" "}
                {spot.busyMorning} / {spot.busyAfternoon} / {spot.busyEvening}
              </p>
              <p className="text-white">
                <strong>Dining Options:</strong>{" "}
                {spot.diningOptions ? spot.diningOptions.join(", ") : "N/A"}
              </p>
            </div>
          ))}
        </div>

        {/* Random spot button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={handleRandomSpot}
            className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600 transition-colors"
          >
            Find Me a Random Spot
          </button>
        </div>
      </div>
    </motion.div>
  );
}
