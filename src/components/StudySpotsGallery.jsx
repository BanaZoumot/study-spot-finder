import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import CheckInForm from "../components/CheckInForm"; // adjust path if needed

export default function StudySpotsGallery() {
  const [spots, setSpots] = useState([]);
  const [recommendedSpots, setRecommendedSpots] = useState([]);
  const [recommendationMessage, setRecommendationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [aggregatedData, setAggregatedData] = useState({});

  // Fetch study spots from Firestore
  useEffect(() => {
    async function fetchSpots() {
      try {
        const snapshot = await getDocs(collection(db, "studySpots"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSpots(data);
      } catch (error) {
        console.error("Error fetching study spots:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSpots();
  }, []);

  // When spots are fetched, use weather to set recommendations
  useEffect(() => {
    if (spots.length > 0) {
      fetchWeatherAndSetRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spots]);

  // Fetch weather from OpenWeatherMap and set recommended spots/message
  async function fetchWeatherAndSetRecommendations() {
    try {
      // Hard-coded Coral Gables, FL coordinates: 25.7210, -80.2680
      const lat = 25.7210;
      const lon = -80.2680;
      const API_KEY = "e90ed50a03a80f1b22b48082826d4674"; // Replace with your key
      const BASE_URL = "https://api.openweathermap.org/data/2.5";
      const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Weather fetch failed");
      }
      const weatherData = await response.json();

      // Extract key weather details
      const temp = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const weatherMain = weatherData.weather[0].main.toLowerCase();
      const weatherDescription = weatherData.weather[0].description.toLowerCase();

      let recs = [...spots];
      let message = "";
      let iconName = "";
      
      // Define weather icons mapping (ensure you have these icons)
      const weatherIcons = {
        "Clear": "clear.png",
        "Clouds": "clouds.png",
        "Rain": "rain.png",
        "Drizzle": "drizzle.png",
        "Thunderstorm": "thunderstorm.png"
      };

      const iconPath = ""; // Update if your icons are in a specific folder

      // Decide which message and icon to display:
      if (weatherMain.includes("rain")) {
        message = "Rainy Day? Cozy up inside for a focused study session!";
        recs = spots.filter((s) => s.indoor === true);
        iconName = weatherIcons["Rain"];
      } else if (weatherMain.includes("clear") || (weatherDescription.includes("scattered clouds") && humidity > 70)) {
        message = "Sun's out! Why not take your study session outside?";
        recs = spots.filter((s) => s.indoor === false);
        iconName = weatherIcons["Clear"];
      } else {
        message = "Outside or Inside! Pick your study spot right now!";
        iconName = weatherIcons["Clouds"];
      }

      // Build the message elements with an animated weather icon in one line
      const messageElements = (
        <div className="flex items-center justify-center">
          <motion.img 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            src={`${iconPath}${iconName}`}
            alt="weather icon"
            style={{
              width: "27px",
              height: "27px",
              filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.5))",
              marginRight: "8px"
            }}
          />
          <span>{message}</span>
        </div>
      );

      setRecommendedSpots(recs);
      setRecommendationMessage(messageElements);
    } catch (err) {
      console.error("Error fetching weather or setting recommendations:", err);
      setRecommendationMessage("Unable to fetch weather data. Showing all study spots.");
      setRecommendedSpots(spots);
    }
  }

  const fetchAndAggregateCheckIns = async (spotId) => {
    try {
      const q = query(
        collection(db, "checkIns"),
        where("spotId", "==", spotId)
      );
      const snapshot = await getDocs(q);
      const checkIns = snapshot.docs.map((doc) => doc.data());

      let totalBusyness = 0;
      let countBusyness = 0;
      let noiseCounts = {
        Quiet: 0,
        Moderate: 0,
        Loud: 0,
      };
      let wifiSpeedCounts = {};

      checkIns.forEach((ci) => {
        if (ci.busyness) {
          countBusyness++;
          switch (ci.busyness) {
            case "Low":
              totalBusyness += 1;
              break;
            case "Moderate":
              totalBusyness += 2;
              break;
            case "High":
              totalBusyness += 3;
              break;
            default:
              break;
          }
        }
        if (ci.noise && noiseCounts.hasOwnProperty(ci.noise)) {
          noiseCounts[ci.noise]++;
        }
        if (ci.wifiSpeed) {
          wifiSpeedCounts[ci.wifiSpeed] = (wifiSpeedCounts[ci.wifiSpeed] || 0) + 1;
        }
      });

      const avgBusynessNumber =
        countBusyness > 0 ? totalBusyness / countBusyness : 0;
      let avgBusynessLabel = "";
      if (avgBusynessNumber > 0) {
        if (avgBusynessNumber < 1.5) avgBusynessLabel = "Low";
        else if (avgBusynessNumber < 2.5) avgBusynessLabel = "Moderate";
        else avgBusynessLabel = "High";
      } else {
        avgBusynessLabel = "No Data";
      }

      const noiseEntries = Object.entries(noiseCounts);
      noiseEntries.sort((a, b) => b[1] - a[1]);
      const topNoise = noiseEntries[0];
      const mostCommonNoise =
        topNoise && topNoise[1] > 0 ? topNoise[0] : "No Data";

      const wifiSpeedEntries = Object.entries(wifiSpeedCounts);
      wifiSpeedEntries.sort((a, b) => b[1] - a[1]);
      const topWifi = wifiSpeedEntries[0];
      const mostCommonWifiSpeed =
        topWifi && topWifi[1] > 0 ? topWifi[0] : "No Data";

      setAggregatedData((prev) => ({
        ...prev,
        [spotId]: {
          avgBusyness: avgBusynessLabel,
          avgBusynessNumber,
          mostCommonNoise,
          mostCommonWifiSpeed,
        },
      }));
    } catch (error) {
      console.error("Error aggregating check-ins:", error);
    }
  };

  const handleCheckInSuccess = (spotId) => {
    fetchAndAggregateCheckIns(spotId);
  };

  useEffect(() => {
    if (selectedSpot) {
      fetchAndAggregateCheckIns(selectedSpot.id);
    }
  }, [selectedSpot]);

  if (loading) {
    return <p className="text-center mt-8 text-white">Loading study spots...</p>;
  }

  return (
    <div className="p-3 h-full w-full bg-black/30 pt-13">
      

      {recommendationMessage && (
        <p className="text-center mt-12 mb-12 text-white">{recommendationMessage}</p>
      )}

      {/* Vertical scroll gallery with a restricted max height */}
      <div className="mt-1 flex flex-col overflow-y-auto space-y-3 py-6 scrollbar-hide snap-y max-h-[calc(100vh-180px)]">
        {(recommendedSpots.length > 0 ? recommendedSpots : spots).map((spot) => (
          <div
            key={spot.id}
            className="cursor-pointer snap-start"
            onClick={() => setSelectedSpot(spot)}
          >
            <img
              src={spot.images && spot.images[0]}
              alt={spot.name}
              className="h-80 object-cover rounded-lg shadow-lg w-full"
            />
          </div>
        ))}
      </div>

      {/* Modal for displaying spot details */}
      <AnimatePresence>
        {selectedSpot && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedSpot(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded shadow-lg w-11/12 max-w-3xl relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Close Button: SMALL, floating top-left */}
              <div className="absolute top-2 left-2 w-6 h-6 bg-white z-40 rounded-sm">
                <button
                  className="w-full h-full flex items-center justify-center text-gray-600 hover:text-black text-[10px] font-bold focus:outline-none z-50"
                  onClick={() => setSelectedSpot(null)}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Top Box: Photo + Name + Description */}
                <div className="bg-white rounded shadow-md p-4 flex flex-col md:flex-row gap-4">
                  <div className="md:w-1/2">
                    <img
                      src={selectedSpot.images && selectedSpot.images[0]}
                      alt={selectedSpot.name}
                      className="w-full h-auto object-cover rounded"
                    />
                  </div>
                  <div className="md:w-1/2 flex flex-col justify-center">
                    <h3 className="text-xl font-bold mb-2">{selectedSpot.name}</h3>
                    <p>{selectedSpot.description}</p>
                  </div>
                </div>

                {/* Bottom Box: Details */}
                <div className="bg-white rounded shadow-md p-4">
                  <p className="mb-2 w-full text-base text-gray-800">
                    <strong>Building:</strong> {selectedSpot.location.building}
                    {selectedSpot.location.room && ` | `}
                    {selectedSpot.location.room && (
                      <>
                        <strong>Room:</strong> {selectedSpot.location.room}
                      </>
                    )}
                    {" | "}
                    <strong>Indoor:</strong> {selectedSpot.indoor ? "Yes" : "No"}
                    {selectedSpot.operatingHours &&
                      Object.keys(selectedSpot.operatingHours).length > 0 && (
                        <>
                          {" | "}
                          <strong>Hours:</strong> {selectedSpot.operatingHours.open} - {selectedSpot.operatingHours.close}
                        </>
                      )}
                  </p>

                  <div className="mb-2 w-full text-base text-gray-800">
                    <strong>Amenities:</strong>{" "}
                    <span>Power Outlets: {selectedSpot.amenities.powerOutlets}</span> |{" "}
                    <span>WiFi: {selectedSpot.amenities.wifi ? "Yes" : "No"}</span> |{" "}
                    <span>Seating Capacity: {selectedSpot.amenities.seatingCapacity}</span> |{" "}
                    <span>Whiteboard: {selectedSpot.amenities.whiteboard ? "Yes" : "No"}</span> |{" "}
                    <span>Natural Light: {selectedSpot.amenities.naturalLight ? "Yes" : "No"}</span>
                    {selectedSpot.amenities.quiet && (
                      <>
                        {" | "}
                        <span>Quiet: {selectedSpot.amenities.quiet}</span>
                      </>
                    )}
                  </div>

                  {selectedSpot.tags && (
                    <p className="mb-1">
                      <strong>Tags:</strong> {selectedSpot.tags.join(", ")}
                    </p>
                  )}

                  <p className="mb-1">
                    <strong>Dining Options:</strong>{" "}
                    {selectedSpot.diningOptions && selectedSpot.diningOptions.length > 0
                      ? selectedSpot.diningOptions.join(", ")
                      : "N/A"}
                  </p>

                  {aggregatedData[selectedSpot.id] && (
                    <div className="mt-4 p-2 border rounded bg-gray-50">
                      <p>
                        <strong>Average Busyness:</strong>{" "}
                        {aggregatedData[selectedSpot.id].avgBusyness}
                      </p>
                      <p>
                        <strong>Most Common Noise:</strong>{" "}
                        {aggregatedData[selectedSpot.id].mostCommonNoise}
                      </p>
                      <p>
                        <strong>Most Common WiFi Speed:</strong>{" "}
                        {aggregatedData[selectedSpot.id].mostCommonWifiSpeed}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => setShowCheckInForm(true)}
                    className="mt-4 bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600 transition-colors"
                  >
                    Check In
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCheckInForm && selectedSpot && (
          <CheckInForm
            spotId={selectedSpot.id}
            onClose={() => setShowCheckInForm(false)}
            onCheckInSuccess={() => handleCheckInSuccess(selectedSpot.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
