// src/pages/LoadingPage.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";

// Helper: Convert "HH:MM" to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function LoadingPage() {
  const [results, setResults] = useState([]);
  const [warning, setWarning] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { filters } = location.state || {};

  // Fetch and filter data
  useEffect(() => {
    async function fetchAndFilter() {
      const classroomsRef = collection(db, "classrooms");
      const conditions = [];

      console.log("Filters received:", filters);

      if (filters) {
        if (filters.building && filters.building.trim() !== "") {
          conditions.push(where("building", "==", filters.building.trim()));
        }
        if (filters.capacity && filters.capacity.toString().trim() !== "") {
          conditions.push(where("capacity", ">=", parseInt(filters.capacity)));
        }
      }

      console.log("Query conditions:", conditions);

      const q =
        conditions.length > 0 ? query(classroomsRef, ...conditions) : classroomsRef;
      try {
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        console.log("Data fetched before schedule filtering:", data);

        // Client-side schedule filtering and time window checks
        if (filters && filters.startTime && filters.duration && filters.selectedDay) {
          const reqStart = timeToMinutes(filters.startTime);
          const reqDuration = parseInt(filters.duration);
          const reqEnd = reqStart + reqDuration * 60;

          // Check start time validity: must be between 7:00 am (420) and 10:00 pm (1320)
          if (reqStart < 420) {
            setWarning("Cannot schedule before 7:00 am. Please choose a valid start time.");
            data = [];
          } else if (reqStart >= 1320) {
            setWarning("Cannot schedule at or after 10:00 pm. Please choose a valid start time.");
            data = [];
          } else {
            // Warn if the requested end time goes past 10:00 pm (1320 minutes)
            if (reqEnd > 1320) {
              setWarning("Your requested time extends beyond 10:00 pm. You can only use the room until 10:00 pm.");
              console.log("End time exceeds 10:00 pm; issuing a warning.");
            }

            // Unavailable on Saturdays and Sundays
            if (["Saturday", "Sunday"].includes(filters.selectedDay)) {
              data = [];
            }

            // Filter out rooms with schedule overlap
            data = data.filter((room) => {
              if (!room.schedule || room.schedule.length === 0) return true;
              return room.schedule.every((entry) => {
                if (!entry.days.includes(filters.selectedDay)) return true;
                const entryStart = timeToMinutes(entry.startTime);
                const entryEnd = timeToMinutes(entry.endTime);
                return reqEnd <= entryStart || reqStart >= entryEnd;
              });
            });
          }
        }
        console.log("Data after schedule filtering:", data);

        // Top Pick selection: choose the room with the closest capacity above partySize (randomly if multiple)
        if (filters && filters.partySize && data.length > 0) {
          const eligibleRooms = data.filter(room => room.capacity >= filters.partySize);
          if (eligibleRooms.length > 0) {
            const minDiff = Math.min(...eligibleRooms.map(room => room.capacity - filters.partySize));
            const topPicks = eligibleRooms.filter(room => (room.capacity - filters.partySize) === minDiff);
            const randomIndex = Math.floor(Math.random() * topPicks.length);
            const topPick = topPicks[randomIndex];
            data = [topPick]; // Only the top pick remains
          } else {
            data = [];
          }
        }
        console.log("Final top pick result:", data);
        setResults(data);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        setResults([]);
      }
    }
    fetchAndFilter();
  }, [filters]);

  // Navigate to ClassesPage after 3 seconds, passing the top pick and any warning
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/classes", { state: { results, warning } });
    }, 3000);
    return () => clearTimeout(timer);
  }, [results, warning, navigate]);

  return (
    <motion.div
      className="relative w-screen h-screen"
      style={{
        backgroundImage: "url('/swirl-background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
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
