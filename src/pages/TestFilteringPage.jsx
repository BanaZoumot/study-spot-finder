// src/pages/TestFilteringWithOnlyTopPick.jsx

import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

// Helper: Convert "HH:MM" to minutes
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function TestFilteringWithOnlyTopPick() {
  const [result, setResult] = useState(null);
  const [warning, setWarning] = useState("");
  const [debugMessages, setDebugMessages] = useState([]);

  // Example filters; adjust as needed:
  const filters = {
    building: "Dooly", // Must match Firestore data exactly
    capacity: "20",           // Filter: capacity >= 30 (for room availability)
    startTime: "20:00",       // 8:00 PM
    duration: "3",           // 3 hours (assuming hours, multiplied by 60 below)
    selectedDay: "Monday",
    partySize: 4              // Party size for top pick selection
  };

  useEffect(() => {
    async function fetchAndFilter() {
      const debug = [];
      try {
        // 1. Firestore Query: Filter by building and capacity
        const classroomsRef = collection(db, "classrooms");
        const conditions = [];
        if (filters.building && filters.building.trim() !== "") {
          conditions.push(where("building", "==", filters.building.trim()));
          debug.push(`Added condition: building == ${filters.building.trim()}`);
        }
        if (filters.capacity && filters.capacity.toString().trim() !== "") {
          const capValue = parseInt(filters.capacity);
          conditions.push(where("capacity", ">=", capValue));
          debug.push(`Added condition: capacity >= ${capValue}`);
        }
        debug.push("Query conditions: " + JSON.stringify(conditions));
  
        const q = conditions.length > 0 ? query(classroomsRef, ...conditions) : classroomsRef;
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        debug.push("Data fetched before schedule filtering: " + JSON.stringify(data));
  
        // 2. Schedule/Time Window Filtering
        if (filters.startTime && filters.duration && filters.selectedDay) {
          const reqStart = timeToMinutes(filters.startTime); // e.g., "20:00" -> 1200 minutes
          const reqDuration = parseInt(filters.duration, 10);   // In hours
          const reqEnd = reqStart + reqDuration * 60;          // End time in minutes
          debug.push(`Computed reqStart: ${reqStart}, reqDuration: ${reqDuration}, reqEnd: ${reqEnd}`);
  
          // Check start time validity (must be between 7:00 AM (420) and 10:00 PM (1320))
          if (reqStart < 420) {
            setWarning("Cannot schedule before 7:00 am. Please choose a valid start time.");
            debug.push("Start time is before 7:00 am. Clearing data.");
            data = [];
          } else if (reqStart >= 1320) {
            setWarning("Cannot schedule at or after 10:00 pm. Please choose a valid start time.");
            debug.push("Start time is at/after 10:00 pm. Clearing data.");
            data = [];
          } else {
            // If end time exceeds allowed limit, warn the user (but still allow the room)
            if (reqEnd > 1320) {
              setWarning("Your requested time extends beyond 10:00 pm. You can only use the room until 10:00 pm.");
              debug.push("End time exceeds 10:00 pm; issuing a warning.");
            }
  
            // Filter out rooms with overlapping schedule entries
            data = data.filter((room) => {
              if (!room.schedule || room.schedule.length === 0) {
                debug.push(`Room ${room.id} has no schedule; including by default.`);
                return true;
              }
              return room.schedule.every((entry) => {
                // If this entry does not include the selected day, no conflict.
                if (!entry.days.includes(filters.selectedDay)) {
                  debug.push(`Room ${room.id}: schedule entry ${JSON.stringify(entry)} does not include ${filters.selectedDay}; including.`);
                  return true;
                }
                const entryStart = timeToMinutes(entry.startTime);
                const entryEnd = timeToMinutes(entry.endTime);
                const noOverlap = reqEnd <= entryStart || reqStart >= entryEnd;
                debug.push(`Room ${room.id}: schedule entry ${JSON.stringify(entry)} | reqEnd: ${reqEnd}, entryStart: ${entryStart}, reqStart: ${reqStart}, entryEnd: ${entryEnd} | Overlap: ${!noOverlap}`);
                return noOverlap;
              });
            });
          }
        }
  
        debug.push("Data after schedule filtering: " + JSON.stringify(data));
  
        // 3. Determine and display only the Top Pick based on partySize
        let topPick = null;
        if (filters.partySize && data.length > 0) {
          // Eligible rooms: must have capacity >= partySize
          const eligibleRooms = data.filter(room => room.capacity >= filters.partySize);
          debug.push("Eligible rooms for top pick: " + JSON.stringify(eligibleRooms));
  
          if (eligibleRooms.length > 0) {
            // Compute the difference between room capacity and partySize
            const diffs = eligibleRooms.map(room => room.capacity - filters.partySize);
            const minDiff = Math.min(...diffs);
            // Get all rooms with the minimal difference
            const topPicks = eligibleRooms.filter(room => (room.capacity - filters.partySize) === minDiff);
            debug.push("Top pick candidates: " + JSON.stringify(topPicks));
  
            // Randomly select one from the top picks if there are multiple
            const randomIndex = Math.floor(Math.random() * topPicks.length);
            topPick = topPicks[randomIndex];
            debug.push("Chosen top pick: " + JSON.stringify(topPick));
          } else {
            debug.push("No eligible rooms found for the specified party size.");
          }
        }
  
        setResult(topPick);
        setDebugMessages(debug);
      } catch (error) {
        setWarning("Error fetching classrooms: " + error.message);
        setDebugMessages(prev => [...prev, "Error fetching classrooms: " + error.message]);
        setResult(null);
      }
    }
  
    fetchAndFilter();
  }, []);
  
  return (
    <div style={{ padding: "20px" }}>
      <h1>Test Filtering with Only Top Pick</h1>
      {warning && (
        <div style={{ marginBottom: "20px", color: "red", fontWeight: "bold" }}>
          {warning}
        </div>
      )}
      <h2>Debug Log</h2>
      <div style={{ background: "#f0f0f0", padding: "10px", borderRadius: "4px" }}>
        {debugMessages.map((msg, index) => (
          <p key={index} style={{ margin: "5px 0" }}>{msg}</p>
        ))}
      </div>
      <h2>Top Pick Result</h2>
      <pre style={{ background: "#e0e0e0", padding: "10px", borderRadius: "4px" }}>
        {result ? JSON.stringify(result, null, 2) : "No room available that meets your criteria."}
      </pre>
    </div>
  );
}
