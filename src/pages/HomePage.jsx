// src/pages/HomePage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // for navigation
import { collection, getDocs } from "firebase/firestore"; // Firestore imports
import { db } from "../firebase/firebaseConfig"; // Your firebase config
import Banner from "../components/Banner";
import BannerRichter from "../components/bannerRichter";
import FilterForm from "../components/FilterForm";
import { motion } from "framer-motion"; // Import motion from Framer Motion
import SensorDataTest from "../components/SensorTestData"; // Import the sensor data component

export default function HomePage() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch classroom data from Firebase when the page loads
  useEffect(() => {
    async function fetchClassrooms() {
      try {
        const snapshot = await getDocs(collection(db, "classrooms"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClassrooms(data);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClassrooms();
  }, []);

  // When the FilterForm is submitted, navigate to the loading page
  // passing the filters and the fetched classroom data.
  const handleFilter = (filters) => {
    console.log("Filters submitted:", filters);
    navigate("/loading", { state: { filters, classrooms } });
  };

  if (loading) {
    return <p className="text-center mt-8">Loading...</p>;
  }

  return (
    // Wrap your main container in a <motion.div> to animate route transitions
    <motion.div
    
      className="relative w-screen h-screen"
      style={{
        backgroundImage: "url('/umvillage.png')", // Ensure umvillage.png is in public/
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      // Framer Motion props:
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.7 }}
    >
      {/* 3) BLACK OVERLAY FOR SENSOR DATA */}
      <div className="absolute top-0 left-0 w-3/8 h-full bg-black/55 text-white flex flex-col pt-20">
        {/* Fixed sensor banner with 80% opacity, now starting below the logo */}
        <div className="bg-black/45 h-14 flex items-center justify-center">
          <BannerRichter />
        </div>
        {/* Scrollable sensor data content below the fixed banner */}
        <div className="overflow-y-auto flex-1">
          <SensorDataTest />
        </div>
      </div>

           {/* Back Button */}
           <div className="absolute top-3 left-2 w-10 h-10">
        <button
          className="w-full h-full flex items-center justify-center focus:outline-none z-50 bg-white rounded-full"
          onClick={() => navigate(-1)}
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

      {/* 1) LOGO in top-left corner, pinned absolutely (unchanged) */}
      <div className="absolute top-0 left-6 z-10 m-4">
        <img src="/logo.png" alt="Site Logo" className="h-auto w-40" />
      </div>

      {/* Black bar with Banner at top */}
      <div className="absolute top-20 left-3/8 w-5/8 bg-black/75 py-1 flex items-center justify-start">
        <Banner />
      </div>

      {/* 4) NEW BLACK OVERLAY (454×579, 55% opacity, starting at 750px left and 150px from top)
          CONTAINING THE FILTER FORM */}
      <div
        className="absolute z-0 flex w-3/9"
        style={{
          paddingLeft: "14px",
          paddingRight: "90px",
          height: "489px",
          left: "52.5%",
          top: "170px",
          backgroundColor: "rgba(0, 0, 0, 0.55)",
        }}
      >
        {/* Added wrapper to let FilterForm’s internal widths (e.g. w-[20vw]) work as expected */}
        <div className="flex justify-center items-center w-full">
          <FilterForm classrooms={classrooms} onFilter={handleFilter} />
        </div>
      </div>
    </motion.div>
  );
}
