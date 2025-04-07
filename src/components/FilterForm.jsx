// src/components/FilterForm.jsx

import React, { useState, useEffect } from "react";
import BuildingDropdown from "../components/BuildingDropdown";
// Helper to get the current day name (e.g., "Monday")
function getCurrentDay() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

export default function FilterForm({ onFilter, classrooms = [] }) {
  const [filters, setFilters] = useState({
    building: "",
    capacity: "",
    startTime: "",
    duration: "",
    selectedDay: getCurrentDay() // Default to the current day
  });

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // HH:MM
  };

  // Generate unique building list
  const uniqueBuildings = [...new Set(classrooms.map((room) => room.building))];

  const handleChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: "10px", display: "flex", flexDirection: "column", flex: "1 1 auto", width: "100%" }}
      className="w-full h-full flex flex-col items-stretch justify-evenly gap-4"
    >
      {/* Building Dropdown */}
      <label className="text-me text-white uppercase mb-1 text-left">
        Which building do you prefer?
      </label>
      <BuildingDropdown
      
  uniqueBuildings={uniqueBuildings}
  filters={filters}
  handleChange={handleChange}
/>

      {/* Capacity Input */}
      <div className="flex flex-col w-full">
        <label className="text-me text-white uppercase mb-1 text-left">
          How many people?
        </label>
        <input
          type="number"
          placeholder=""
          onChange={(e) => handleChange("capacity", e.target.value)}
          value={filters.capacity}
          className="h-8 box-border rounded-full bg-white text-black text-base px-2 border-none focus:outline-none"
          style={{ width: "30vw" }}
        />
      </div>

      {/* Start Time Input */}
      <div className="flex flex-col w-full">
        <label className="text-sm text-white uppercase mb-1 text-left">
          What time do you want to study?
        </label>
        <input
          type="time"
          placeholder=""
          value={filters.startTime}
          onChange={(e) => handleChange("startTime", e.target.value)}
          className="h-8 box-border rounded-full bg-white text-black text-base px-4 border-none focus:outline-none"
          style={{ width: "30vw" }}
        />
        <button
          type="button"
          onClick={() => handleChange("startTime", getCurrentTime())}
          className="mt-2 bg-orange-500 text-white text-sm rounded-full px-4 py-2 font-semibold uppercase w-auto self-start hover:bg-orange-600 transition-colors"
        >
          Now
        </button>
      </div>

      {/* Duration Input */}
      <div className="flex flex-col w-full">
        <label className="text-sm text-white uppercase mb-1 text-left">
          How many hours will you study?
        </label>
        <input
          type="number"
          placeholder=""
          onChange={(e) => handleChange("duration", e.target.value)}
          value={filters.duration}
          className="h-8 box-border rounded-full bg-white text-black text-base px-2 border-none focus:outline-none"
          style={{ width: "30vw" }}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="bg-orange-500 text-white text-base rounded-full px-2 py-3 font-bold uppercase mt-4 hover:bg-orange-600 transition-colors self-start"
      >
        LET’S GO!
      </button>
    </form>
  );
}
