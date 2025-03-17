// src/components/WeatherBasedRecs.jsx
import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// 1) Hard-code your API key here
const API_KEY = "e90ed50a03a80f1b22b48082826d4674";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export default function WeatherBasedRecs() {
  const [spots, setSpots] = useState([]);
  const [recommended, setRecommended] = useState([]);

  // 2) Fetch your study spots from Firestore
  useEffect(() => {
    async function fetchSpots() {
      try {
        const snapshot = await getDocs(collection(db, "studySpots"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSpots(data);
      } catch (err) {
        console.error("Error fetching spots:", err);
      }
    }
    fetchSpots();
  }, []);

  // 3) Once spots are fetched, fetch the weather & decide recommendations
  useEffect(() => {
    if (spots.length > 0) {
      fetchWeatherAndSetRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots]);

  async function fetchWeatherAndSetRecommendations() {
    try {
      // Hard-code a latitude/longitude or retrieve from user/campus
      const lat = 25.7492; // example: San Francisco
      const lon = -80.2635;

      // Build the weather API URL
      const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Weather fetch failed");
      }
      const weatherData = await response.json();

      // 4) Interpret the weather data
      //    For example, check if it’s rainy or clear, look at humidity, etc.
      const weatherMain = weatherData.weather[0].main.toLowerCase(); // e.g. "rain", "clear", "clouds"
      const humidity = weatherData.main.humidity; // e.g. 75

      let recs = [...spots]; // default: recommend all spots

      // Basic logic: if it’s rainy, prefer indoor
      if (weatherMain.includes("rain")) {
        recs = spots.filter((s) => s.indoor === true);
      }
      // If it’s clear and not too humid, prefer outdoor
      else if (weatherMain.includes("clear") && humidity < 70) {
        recs = spots.filter((s) => s.indoor === false);
      }

      // 5) Set the recommended spots
      setRecommended(recs);
    } catch (err) {
      console.error("Error fetching weather or setting recs:", err);
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h2 className="text-xl font-bold mb-2">
        Weather-Based Recommended Spots
      </h2>
      {recommended.length > 0 ? (
        recommended.map((spot) => (
          <p key={spot.id} className="mb-1">
            {spot.name}
          </p>
        ))
      ) : (
        <p>No recommended spots yet.</p>
      )}
    </div>
  );
}
