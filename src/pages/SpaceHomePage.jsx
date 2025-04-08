import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import BannerSpots from "../components/BannerSpots";
import StudySpotsGallery from "../components/StudySpotsGallery";
import StudySpotFilterForm from "../components/StudySpotsFilterForm";

export default function HomePage() {
  const navigate = useNavigate();
  const [studySpots, setStudySpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudySpots = async () => {
      try {
        // Use correct collection name "studyspots" (all lowercase)
        const snapshot = await getDocs(collection(db, "studySpots"));
        const spots = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudySpots(spots);
      } catch (error) {
        console.error("Error fetching study spots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudySpots();
  }, []);

  const handleFilter = (filters) => {
    console.log("Filters applied:", filters);
    // Navigate to the loading page for study spots
    navigate("/loading-study-spots", { state: { filters, studySpots } });
  };

  if (loading) {
    return <p className="text-center mt-8">Loading...</p>;
  }

  // Safely extract unique buildings using optional chaining
  const uniqueBuildings = [
    ...new Set(
      studySpots.map(spot => spot?.location?.building).filter(Boolean)
    )
  ];

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
      <div className="absolute top-0 left-0 w-3/8 h-full bg-black/55">
        <StudySpotsGallery />
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

      <div className="absolute top-0 left-6 z-10 m-4">
        <img src="/logo.png" alt="Site Logo" className="h-auto w-40" />
      </div>

      <div className="absolute top-20 left-3/8 w-5/8 bg-black/65 py-1 flex items-center justify-start">
        <BannerSpots />
      </div>

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
       <div className="flex justify-center items-center w-full">
          <StudySpotFilterForm
            studySpots={studySpots}
            uniqueBuildings={uniqueBuildings}
            onFilter={handleFilter}
          />
       </div>
      </div>
    </motion.div>
  );
}
