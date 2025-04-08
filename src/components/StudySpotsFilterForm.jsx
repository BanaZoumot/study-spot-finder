import React, { useState } from 'react';
import BuildingDropdown from '../components/BuildingDropdown';

function getCurrentDay() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}

// New BusynessDropdown component with identical styling to BuildingDropdown
const BusynessDropdown = ({ filters, handleChange }) => {
  const [open, setOpen] = useState(false);
  const options = ["Quiet", "Busy", "No Preference"];

  const toggleDropdown = () => setOpen(!open);

  const selectOption = (value) => {
    handleChange("busyness", value);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      {/* Dropdown trigger */}
      <div
        className="cursor-pointer bg-white text-black text-base px-4 py-1 flex justify-between items-center rounded-full"
        style={{ width: "30vw" }}
        onClick={toggleDropdown}
      >
        <span>{filters.busyness || "Select Busyness"}</span>
        <span className="ml-2">{open ? "-" : "+"}</span>
      </div>
      {/* Dropdown list */}
      {open && (
        <ul className="absolute z-10 w-[30vw] bg-white mt-1 rounded shadow transition-all duration-400">
          {options.map((option, index) => (
            <li
              key={index}
              className="px-4 py-3 hover:bg-gray-200 cursor-pointer"
              onClick={() => selectOption(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// New reusable StyledInput that applies the same styling directly to the <input>
const StyledInput = ({ type, value, onChange, placeholder }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className="w-[30vw] bg-white text-black text-base rounded-full focus:outline-none appearance-none"
    style={{
      padding: "0.25rem", // equivalent to py-1 px-4
      paddingLeft: "0", // Remove left padding
      borderRadius: "9999px",
      WebkitAppearance: "none",
      MozAppearance: "none",
      appearance: "none"
    }}
  />
);




// Multi-select dropdown with fixed 30vw width (unchanged)
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
    <div className="relative" style={{ width: "30vw" }}>
      <div
        className="cursor-pointer bg-white text-black text-base px-4 py-1 flex justify-between rounded-full"
        onClick={toggleDropdown}
      >
        <span>
          {selectedOptions.length > 0 ? selectedOptions.join(", ") : placeholder}
        </span>
        <span className="ml-2">{open ? "-" : "+"}</span>
      </div>
      {open && (
        <ul
          className="absolute z-10 w-full bg-white mt-1 rounded shadow transition-all duration-400 max-h-36 overflow-y-auto"
          style={{ textAlign: "left" }}
        >
          {options.map((option, index) => (
            <li
              key={index}
              onClick={() => toggleOption(option)}
              style={{
                display: "flex",
                alignItems: "left",
                justifyContent: "flex-start",
                textAlign: "left",
                width: "100%",
                padding: "0.75rem 1rem"
              }}
              className="hover:bg-gray-200 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedOptions.includes(option)}
                readOnly
                style={{ marginRight: "0.5rem" }}
              />
              <span style={{ display: "block", textAlign: "left", width: "100%" }}>
                {option}
              </span>
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
    selectedAttributes: [],
    startTime: "",
    duration: "",
    busyness: "No Preference",
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
      style={{ padding: "1px", display: "flex", flexDirection: "column", width: "100%" }}
      className="w-full h-full flex flex-col items-start justify-evenly gap-2"
    >
      {/* BUILDING */}
      <div style={{ width: "30vw" }}>
        <label className="block mb-1 text-sm text-white uppercase text-left">
          Which building do you prefer?
        </label>
        <BuildingDropdown 
          uniqueBuildings={uniqueBuildings} 
          filters={filters} 
          handleChange={handleChange} 
        />
      </div>

      {/* ATTRIBUTES MULTI-SELECT */}
      <div>
        <label className="block mb-1 text-sm text-white uppercase text-left">
          Which attributes?
        </label>
        <MultiSelectDropdown
          options={attributeOptions}
          selectedOptions={filters.selectedAttributes}
          onChange={(value) => handleChange("selectedAttributes", value)}
          placeholder="Select attributes"
        />
      </div>

      {/* BUSYNESS as Dropdown */}
      <div style={{ width: "30vw" }}>
        <label className="block mb-1 text-sm text-white uppercase text-left">
          Busyness:
        </label>
        <BusynessDropdown filters={filters} handleChange={handleChange} />
      </div>

      {/* TIME INPUT */}
      <div style={{ width: "37.5vw" }}>
  <label className="block mb-1 text-sm text-white uppercase text-left rounded-full">
    What time do you want to study?
  </label>
  <StyledInput
    type="time"
    value={filters.startTime}
    onChange={(e) => handleChange("startTime", e.target.value)}
    style={{ height: "8px" }} // Adjust the height as needed
  />
  <button
    type="button"
    onClick={setNow}
    className="block w-full bg-orange-500 text-white text-base px-4 py-3 rounded-full focus:outline-none hover:bg-orange-600 transition-colors"
    style={{
      WebkitAppearance: "none",
      MozAppearance: "none",
      appearance: "none",
      marginLeft: 0,
    }}
  >
    Now
  </button>
</div>


      {/* DURATION INPUT */}
      <div style={{ width: "30vw" }}>
        <label className="block mb-1 text-sm text-white uppercase text-left">
          How many hours will you study?
        </label>
        <StyledInput
          type="number"
          value={filters.duration}
          onChange={(e) => handleChange("duration", e.target.value)}
        />
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        className="bg-orange-500 text-white text-base rounded-full px-4 py-2 font-bold uppercase mt-2 hover:bg-orange-600 transition-colors"
      >
        LET’S GO!
      </button>
    </form>
  );
}
