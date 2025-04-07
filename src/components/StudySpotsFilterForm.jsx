import React, { useState } from 'react';
import BuildingDropdown from '../components/SpaceDropdown'; // Reusable dropdown for buildings

function getCurrentDay() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

// Custom multi-select dropdown component
const MultiSelectDropdown = ({ options, selectedOptions, onChange, placeholder }) => {
  const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen(!open);

  const toggleOption = (option) => {
    if (selectedOptions.includes(option)) {
      onChange(selectedOptions.filter(item => item !== option));
    } else {
      onChange([...selectedOptions, option]);
    }
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <div 
        className="cursor-pointer bg-white text-black text-base px-4 flex justify-between items-center"
        style={{ width: "30vw", height: "2rem" }}
        onClick={toggleDropdown}
      >
        <span>
          {selectedOptions.length > 0 ? selectedOptions.join(", ") : placeholder}
        </span>
        <span className="ml-2">{open ? "-" : "+"}</span>
      </div>
      {/* Dropdown list */}
      {open && (
        <ul className="absolute z-10 w-[30vw] bg-white mt-1 rounded shadow max-h-40 overflow-y-auto">
          {options.map((option, index) => (
            <li 
              key={index} 
              className="px-4 py-2 hover:bg-gray-200 cursor-pointer flex items-center"
              onClick={() => toggleOption(option)}
            >
              <input 
                type="checkbox" 
                checked={selectedOptions.includes(option)} 
                readOnly 
                className="mr-2"
              />
              <span>{option}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default function StudySpotFilterForm({ onFilter, studySpots = [] }) {
  const [filters, setFilters] = useState({
    building: "",
    selectedAttributes: [], // Multi-select for attributes: Indoor, Outdoor, Whiteboard, Power Outlets
    startTime: "",
    duration: "",
    busyness: "No Preference", // Options: "Quiet", "Busy", "No Preference"
    selectedDay: getCurrentDay()
  });

  // Extract unique buildings safely from the nested location
  const uniqueBuildings = [
    ...new Set(
      studySpots.map(spot => spot?.location?.building).filter(Boolean)
    )
  ];

  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const setNow = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    handleChange("startTime", `${hours}:${minutes}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  // Options for our multi-select: Indoor, Outdoor, Whiteboard, Power Outlets
  const attributeOptions = ["Indoor", "Outdoor", "Whiteboard", "Power Outlets"];

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: "10px", display: "flex", flexDirection: "column", width: "100%" }}
      className="w-full h-full flex flex-col items-stretch justify-evenly gap-4"
    >
      {/* Buildings Dropdown */}
      <BuildingDropdown
        uniqueBuildings={uniqueBuildings}
        filters={filters}
        handleChange={handleChange}
      />

      {/* Multi-select for Attributes */}
      <div>
        <label className="block mb-2 font-medium">Attributes:</label>
        <MultiSelectDropdown 
          options={attributeOptions} 
          selectedOptions={filters.selectedAttributes} 
          onChange={(value) => handleChange("selectedAttributes", value)}
          placeholder="Select attributes"
        />
      </div>

      {/* Busyness Preference */}
      <div className="flex items-center gap-4">
        <span className="font-medium">Busyness:</span>
        <label>
          <input
            type="radio"
            name="busyness"
            value="Quiet"
            checked={filters.busyness === "Quiet"}
            onChange={(e) => handleChange("busyness", e.target.value)}
          />
          Quiet
        </label>
        <label>
          <input
            type="radio"
            name="busyness"
            value="Busy"
            checked={filters.busyness === "Busy"}
            onChange={(e) => handleChange("busyness", e.target.value)}
          />
          Busy
        </label>
        <label>
          <input
            type="radio"
            name="busyness"
            value="No Preference"
            checked={filters.busyness === "No Preference"}
            onChange={(e) => handleChange("busyness", e.target.value)}
          />
          No Preference
        </label>
      </div>

      {/* Time Input with Now Button */}
      <div className="flex flex-col">
        <label className="mb-1 font-medium">Study Start Time:</label>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={filters.startTime}
            onChange={(e) => handleChange("startTime", e.target.value)}
            className="h-8 box-border rounded bg-white text-black px-2"
          />
          <button 
            type="button" 
            onClick={setNow} 
            className="bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600 transition-colors"
          >
            Now
          </button>
        </div>
      </div>

      {/* Duration Input */}
      <input
        type="number"
        placeholder="Duration (hours)"
        value={filters.duration}
        onChange={(e) => handleChange("duration", e.target.value)}
        className="h-8 box-border rounded bg-white text-black px-2"
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 transition-colors"
      >
        Find Study Spots
      </button>
    </form>
  );
}
