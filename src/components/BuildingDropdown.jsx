import React, { useState } from "react";

const BuildingDropdown = ({ uniqueBuildings, filters, handleChange }) => {
  const [open, setOpen] = useState(false);

  const toggleDropdown = () => setOpen(!open);

  const selectOption = (value) => {
    handleChange("building", value);
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
        <span>{filters.building || "All Buildings"}</span>
        <span className="ml-2">{open ? "-" : "+"}</span>
      </div>
      {/* Dropdown list */}
      {open && (
        <ul className="absolute z-10 w-[30vw] bg-white mt-1 rounded shadow transition-all duration-400 max-h-36 overflow-y-auto">
          <li
            className="px-4 py-3 hover:bg-gray-200 cursor-pointer"
            onClick={() => selectOption("")}
          >
            All Buildings
          </li>
          {uniqueBuildings.map((building, index) => (
            <li
              key={index}
              className="px-4 py-3 hover:bg-gray-200 cursor-pointer rounded-full"
              onClick={() => selectOption(building)}
            >
              {building}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BuildingDropdown;
