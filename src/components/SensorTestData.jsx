// src/components/SensorDataTest.jsx
import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { realtimeDatabase } from "../firebase/firebaseConfig";

const SensorDataTest = () => {
  const [unitsData, setUnitsData] = useState(null);

  // Helper function: if the sensor value is an object,
  // extract a known property (like average_db) or stringify it.
  const displaySensorValue = (value) => {
    if (typeof value === "object" && value !== null) {
      if (value.average_db !== undefined) {
        return value.average_db;
      }
      return JSON.stringify(value);
    }
    return value;
  };

  useEffect(() => {
    // Listen to the root of your database
    const rootRef = ref(realtimeDatabase);
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase snapshot data:", data);
      setUnitsData(data);
    });
    return () => unsubscribe();
  }, []);

  if (!unitsData) {
    return <div>Loading sensor data...</div>;
  }

  return (
    <div>
      <h1>All Units Sensor Data</h1>
      {Object.entries(unitsData).map(([unitId, unitData]) => (
        <div
          key={unitId}
          style={{
            border: "1px solid #ccc",
            margin: "10px",
            padding: "10px",
            borderRadius: "4px",
          }}
        >
          <h2>Unit: {unitId}</h2>
          <div>
            <strong>LiDAR:</strong>{" "}
            {unitData.LiDAR ? (
              typeof unitData.LiDAR === "object" &&
              unitData.LiDAR.motion_status !== undefined ? (
                <span>Motion Status: {unitData.LiDAR.motion_status}</span>
              ) : (
                <span>{displaySensorValue(unitData.LiDAR)}</span>
              )
            ) : (
              <span>No LiDAR data</span>
            )}
          </div>
          <div>
            <strong>WiFi Sniffing:</strong>{" "}
            {unitData.WiFi_Sniffing ? (
              <span>{displaySensorValue(unitData.WiFi_Sniffing)}</span>
            ) : (
              <span>No WiFi Sniffing data</span>
            )}
          </div>
          <div>
            <strong>Microphone:</strong>{" "}
            {unitData.Microphone ? (
              <span>{displaySensorValue(unitData.Microphone)}</span>
            ) : (
              <span>No Microphone data</span>
            )}
          </div>
          <h3>Raw Data:</h3>
          <pre>{JSON.stringify(unitData, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
};

export default SensorDataTest;
