import React from "react";

export default function ClassroomCard({ room }) {
  return (
    <div className="classroom-card">
      <h3>📍 {room.roomName} - {room.building}</h3>
      <p>👥 Capacity: {room.capacity}</p>
      <p>🏢 Floor: {room.floor}</p>
      <p>📆 Schedule: {room.schedule.length > 0 ? "Has classes" : "Free all day!"}</p>
    </div>
  );
}

