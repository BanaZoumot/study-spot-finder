import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function StudySpotsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results, warning } = location.state || {};
  const { topPick, otherOptions } = results || { topPick: null, otherOptions: [] };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {warning && (
        <div className="bg-yellow-200 text-yellow-800 p-2 mb-4 rounded">
          {warning}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Study Spots</h1>
      
      {topPick ? (
        <div className="mb-8 p-4 bg-white shadow rounded">
          <h2 className="text-xl font-semibold mb-2">Top Pick</h2>
          <p><strong>Name:</strong> {topPick.name}</p>
          <p><strong>Description:</strong> {topPick.description}</p>
          <p><strong>Building:</strong> {topPick.location?.building}</p>
          <p><strong>Indoor:</strong> {topPick.indoor ? "Yes" : "No"}</p>
          <p><strong>Whiteboard:</strong> {topPick.amenities?.whiteboard ? "Yes" : "No"}</p>
          <p><strong>Power Outlets:</strong> {topPick.amenities?.powerOutlets || "N/A"}</p>
          {/* Add additional details as needed */}
        </div>
      ) : (
        <p>No top pick found.</p>
      )}

      <h2 className="text-xl font-semibold mb-2">Other Options</h2>
      <div className="grid grid-cols-1 gap-4">
        {otherOptions && otherOptions.length > 0 ? (
          otherOptions.map((spot) => (
            <div key={spot.id} className="p-4 bg-white shadow rounded">
              <h3 className="text-lg font-bold">{spot.name}</h3>
              <p>{spot.description}</p>
              <p><strong>Building:</strong> {spot.location?.building}</p>
              <p><strong>Indoor:</strong> {spot.indoor ? "Yes" : "No"}</p>
              <p><strong>Whiteboard:</strong> {spot.amenities?.whiteboard ? "Yes" : "No"}</p>
              <p><strong>Power Outlets:</strong> {spot.amenities?.powerOutlets || "N/A"}</p>
            </div>
          ))
        ) : (
          <p>No other study spots match your filters.</p>
        )}
      </div>

      <button
        onClick={() => navigate(-1)}
        className="mt-8 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        Back
      </button>
    </div>
  );
}
