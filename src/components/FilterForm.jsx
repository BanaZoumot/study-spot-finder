import React, { useState, useEffect } from "react";

export default function FilterForm({ onFilter, classrooms }) {
  const [filters, setFilters] = useState({
    building: "",
    capacity: "",
    startTime: "",
    duration: "",
    selectedDay: "",
  });

  // Generate current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // Extract HH:MM
  };

  // Populate buildings dropdown dynamically
  const uniqueBuildings = [...new Set(classrooms.map(room => room.building))];

  const handleChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <form className="filter-form" onSubmit={handleSubmit}>
      <h2>🧐 Let's find the perfect study spot!</h2>

      {/* Building Dropdown */}
      <div className="filter-group">
        <p>📍 Which building do you prefer?</p>
        <select onChange={(e) => handleChange("building", e.target.value)}>
          <option value="">All Buildings</option>
          {uniqueBuildings.map((building, index) => (
            <option key={index} value={building}>{building}</option>
          ))}
        </select>
      </div>

      {/* Capacity Input */}
      <div className="filter-group">
        <p>🎓 How many people?</p>
        <input type="number" placeholder="Minimum capacity" onChange={(e) => 
handleChange("capacity", e.target.value)} />
      </div>

      {/* Start Time Selector with "Now" Button */}
      <div className="filter-group">
        <p>⏳ What time do you want to study?</p>
        <input type="time" value={filters.startTime} onChange={(e) => handleChange("startTime", 
e.target.value)} />
        <button type="button" onClick={() => handleChange("startTime", getCurrentTime())}>
          ⏰ Now
        </button>
      </div>

      {/* Duration Input */}
      <div className="filter-group">
        <p>⌛ How long will you study?</p>
        <input type="number" placeholder="Duration in hours" onChange={(e) => 
handleChange("duration", e.target.value)} />
      </div>

      {/* Day Selector */}
      <div className="filter-group">
        <p>📅 Which day?</p>
        <select onChange={(e) => handleChange("selectedDay", e.target.value)}>
          <option value="">Select a day</option>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="submit-btn">🔍 Find My Spot</button>
    </form>
  );
}

