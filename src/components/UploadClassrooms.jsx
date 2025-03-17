import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

function DisplayClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [buildingFilter, setBuildingFilter] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "classrooms"));
        const classroomData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClassrooms(classroomData);
        setFilteredClassrooms(classroomData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  // Function to check if a room is available on the selected day and time
  const isAvailable = (room, day, start, duration) => {
    if (!room.schedule || !room.schedule[day]) return true;

    const startTimeNum = parseInt(start.replace(":", ""));
    const endTimeNum = startTimeNum + parseInt(duration) * 100;

    for (const slot of room.schedule[day]) {
      const bookedStart = parseInt(slot.startTime.replace(":", ""));
      const bookedEnd = parseInt(slot.endTime.replace(":", ""));

      if (
        (startTimeNum >= bookedStart && startTimeNum < bookedEnd) ||
        (endTimeNum > bookedStart && endTimeNum <= bookedEnd) ||
        (startTimeNum <= bookedStart && endTimeNum >= bookedEnd)
      ) {
        return false;
      }
    }
    return true;
  };

  // Function to handle filtering based on all criteria
  useEffect(() => {
    let filtered = classrooms.filter((room) => {
      return (
        room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (buildingFilter ? room.building.toLowerCase() === buildingFilter.toLowerCase() : true) &&
        (minCapacity ? room.capacity >= parseInt(minCapacity) : true) &&
        (selectedDay && startTime && duration ? isAvailable(room, selectedDay, startTime, duration) : true)
      );
    });
    setFilteredClassrooms(filtered);
  }, [searchQuery, buildingFilter, minCapacity, selectedDay, startTime, duration, classrooms]);

  if (loading) {
    return <p>Loading classrooms...</p>;
  }

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Available Classrooms</h2>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by Room Name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />

        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        >
          <option value="">All Buildings</option>
          {[...new Set(classrooms.map((room) => room.building))].map((building, index) => (
            <option key={index} value={building}>
              {building}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Min Capacity"
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />

        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        >
          <option value="">Select Day</option>
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
          <option value="Saturday">Saturday</option>
          <option value="Sunday">Sunday</option>
        </select>

        <input
          type="time"
          placeholder="Start Time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />

        <input
          type="number"
          placeholder="Duration (hours)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={{ marginRight: "10px", padding: "8px" }}
        />
      </div>

      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredClassrooms.length > 0 ? (
          filteredClassrooms.map((room) => (
            <li
              key={room.id}
              style={{
                marginBottom: "10px",
                border: "1px solid #ccc",
                padding: "10px",
                borderRadius: "5px",
              }}
            >
              <strong>Room:</strong> {room.roomName}, <strong>Building:</strong> {room.building},{" "}
              <strong>Capacity:</strong> {room.capacity}
            </li>
          ))
        ) : (
          <p>No classrooms found matching criteria.</p>
        )}
      </ul>
    </div>
  );
}
<div className="bg-blue-500 text-white p-4 rounded">
  I should have a blue background!
</div>

export default DisplayClassrooms;

