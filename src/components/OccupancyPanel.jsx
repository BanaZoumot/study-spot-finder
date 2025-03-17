// src/components/OccupancyPanel.jsx
import React from "react";

export default function OccupancyPanel({ title, occupancy }) {
  return (
    <div className="bg-white/80 rounded-lg shadow p-4 text-center">
      <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      <p className="text-4xl font-extrabold text-orange-500">{occupancy}%</p>
      <p className="text-sm text-gray-700">OCCUPANCY</p>
    </div>
  );
}
