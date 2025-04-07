import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

// Helper: Convert "HH:MM" to total minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function LoadingStudySpotsPage() {
  const [results, setResults] = useState({ topPick: null, otherOptions: [] });
  const [warning, setWarning] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { filters } = location.state || {};

  useEffect(() => {
    async function fetchAndFilter() {
      try {
        console.log("Filters received:", filters);
        const studySpotsRef = collection(db, "studyspots");
        const conditions = [];
  
        // Building filter (exact match)
        if (filters?.building && filters.building.trim() !== "") {
          conditions.push(where("location.building", "==", filters.building.trim()));
        }
  
        // Build Firestore query (only building is pushed to Firestore)
        const q = conditions.length > 0 ? query(studySpotsRef, ...conditions) : studySpotsRef;
        console.log("Firestore query conditions:", conditions);
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log("Data fetched from Firestore:", data);
  
        // Operating Hours filtering:
        if (filters?.startTime && filters?.duration) {
          const reqStart = timeToMinutes(filters.startTime);
          const reqDuration = parseInt(filters.duration, 10);
          const reqEnd = reqStart + reqDuration * 60;
          data = data.filter(spot => {
            let openTime, closeTime;
            if (!spot.operatingHours || Object.keys(spot.operatingHours).length === 0) {
              openTime = 0;
              closeTime = 1440; // Open 24/7
            } else {
              openTime = timeToMinutes(spot.operatingHours.open || "00:00");
              closeTime = timeToMinutes(spot.operatingHours.close || "23:59");
            }
            return reqStart >= openTime && reqEnd <= closeTime;
          });
        }
        console.log("After operating hours filtering:", data);
  
        // New: Client-side filtering using the multi-select attributes:
        if (filters?.selectedAttributes && filters.selectedAttributes.length > 0) {
          // Indoor/Outdoor filtering:
          const hasIndoor = filters.selectedAttributes.includes("Indoor");
          const hasOutdoor = filters.selectedAttributes.includes("Outdoor");
          if (hasIndoor && !hasOutdoor) {
            data = data.filter(spot => spot.indoor === true);
          } else if (hasOutdoor && !hasIndoor) {
            data = data.filter(spot => spot.indoor === false);
          }
          // Whiteboard filtering:
          if (filters.selectedAttributes.includes("Whiteboard")) {
            data = data.filter(spot => spot.amenities?.whiteboard === true);
          }
          // Power Outlets filtering:
          if (filters.selectedAttributes.includes("Power Outlets")) {
            data = data.filter(spot => {
              const outletRating = (spot.amenities?.powerOutlets || "").toLowerCase();
              return outletRating !== "none";
            });
          }
        }
        console.log("After attribute filtering:", data);
  
        // Busyness filtering (unchanged)
        if (filters?.busyness && filters.busyness !== "No Preference") {
          if (filters.busyness === "Quiet") {
            data = data.filter(spot => {
              const quietLevel = (spot.amenities?.quiet || "").toLowerCase();
              return quietLevel === "high";
            });
          } else if (filters.busyness === "Busy") {
            data = data.filter(spot => {
              const quietLevel = (spot.amenities?.quiet || "").toLowerCase();
              return quietLevel !== "high";
            });
          }
        }
        console.log("After busyness filtering:", data);
  
        // Match scoring (example)
        data = data.map(spot => {
          let score = 0;
          if (filters?.building && spot?.location?.building === filters.building.trim()) {
            score += 1;
          }
          if (filters?.selectedAttributes && filters.selectedAttributes.includes("Whiteboard") && spot.amenities?.whiteboard) {
            score += 1;
          }
          if (filters?.selectedAttributes && filters.selectedAttributes.includes("Power Outlets")) {
            const outletRating = (spot.amenities?.powerOutlets || "").toLowerCase();
            if (outletRating !== "none") score += 1;
          }
          if (filters?.busyness && filters.busyness !== "No Preference") {
            const quietLevel = (spot.amenities?.quiet || "").toLowerCase();
            if (filters.busyness === "Quiet" && quietLevel === "high") {
              score += 1;
            } else if (filters.busyness === "Busy" && quietLevel !== "high") {
              score += 1;
            }
          }
          return { ...spot, score };
        });
        data.sort((a, b) => b.score - a.score);
        const topPick = data.length > 0 ? data[0] : null;
        const otherOptions = data.length > 1 ? data.slice(1) : [];
        console.log("Final results - Top Pick:", topPick, "Other Options:", otherOptions);
        setResults({ topPick, otherOptions });
      } catch (error) {
        console.error("Error filtering study spots:", error);
        setResults({ topPick: null, otherOptions: [] });
      }
    }
    fetchAndFilter();
  }, [filters]);
  
  // Navigate to output page after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/StudySpotsPage", { state: { results, warning } });
    }, 3000);
    return () => clearTimeout(timer);
  }, [results, warning, navigate]);

  return (
    <motion.div
      className="relative w-screen h-screen"
      style={{
        backgroundImage: "url('/swirl-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-black/0"></div>
      <div
        className="absolute flex items-center justify-end"
        style={{
          top: "370px",
          left: "0",
          width: "940px",
          height: "70px",
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          paddingRight: "20px"
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 1.8 }}
        >
          <span className="text-white text-3xl">WE GOT</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
