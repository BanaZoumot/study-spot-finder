import React, { useState, useEffect } from "react";
import { db } from "../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import ClassroomCard from "../components/ClassroomCard";
import FilterForm from "../components/FilterForm";

export default function DisplayClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [filteredClassrooms, setFilteredClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const applyFilters = (filters) => {
    let filtered = classrooms.filter((room) => {
      const { building, capacity, startTime, duration, selectedDay } = filters;

      const matchesBuilding = building ? room.building.toLowerCase() === building.toLowerCase() : true;
      const matchesCapacity = capacity ? room.capacity >= parseInt(capacity) : true;

      const matchesTime = startTime && duration && selectedDay
        ? !room.schedule.some((entry) => {
            if (!entry.days.includes(selectedDay)) return false;

            const roomStart = parseInt(entry.startTime.replace(":", ""));
            const roomEnd = parseInt(entry.endTime.replace(":", ""));
            const selectedStart = parseInt(startTime.replace(":", ""));
            const selectedEnd = selectedStart + parseInt(duration) * 100;

            return selectedStart < roomEnd && selectedEnd > roomStart;
          })
        : true;

      return matchesBuilding && matchesCapacity && matchesTime;
    });

    setFilteredClassrooms(filtered);
  };

  if (loading) return <p>Loading classrooms...</p>;

  return (
    <div className="container">
      {/* 🚀 Video Banner */}
      <div className="video-banner">
        <video autoPlay loop muted playsInline className="banner-video">
          <source src="/videos/campus-banner.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <h1>📚 Find Your Perfect Study Spot!</h1>
      <FilterForm onFilter={applyFilters} classrooms={classrooms} />
      <div className="classroom-list">
        {filteredClassrooms.length > 0 ? (
          filteredClassrooms.map((room) => <ClassroomCard key={room.id} room={room} />)
        ) : (
          <p>No available classrooms matching your filters.</p>
        )}
      </div>
    </div>
  );
}

<div className="bg-blue-500 text-white p-4 rounded">
  This should have a blue background.
</div>