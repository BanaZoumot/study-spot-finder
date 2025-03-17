import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import CheckInForm from "../components/CheckInForm"; // adjust path if needed

export default function StudySpotsGallery() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [showCheckInForm, setShowCheckInForm] = useState(false);

  // Store aggregated data in state: e.g. { [spotId]: { avgBusyness, avgNoise } }
  const [aggregatedData, setAggregatedData] = useState({});

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

  /**
   * Fetch check-in documents for a given spotId,
   * aggregate them, and store the results in state.
   */
  const fetchAndAggregateCheckIns = async (spotId) => {
    try {
      // 1. Get all check-ins for this spotId
      const q = query(
        collection(db, "checkIns"),
        where("spotId", "==", spotId)
      );
      const snapshot = await getDocs(q);
      const checkIns = snapshot.docs.map((doc) => doc.data());

      // 2. Convert textual ratings to numeric for busyness (optional)
      //    Example: Low -> 1, Moderate -> 2, High -> 3
      //    Or you can just count frequencies of each label
      let totalBusyness = 0;
      let countBusyness = 0;

      let noiseCounts = {
        Quiet: 0,
        Moderate: 0,
        Loud: 0,
      };

      checkIns.forEach((ci) => {
        // For busyness
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
        // For noise
        if (ci.noise && noiseCounts.hasOwnProperty(ci.noise)) {
          noiseCounts[ci.noise]++;
        }
      });

      // 3. Calculate average busyness (as a number)
      const avgBusynessNumber =
        countBusyness > 0 ? totalBusyness / countBusyness : 0;

      // Convert avgBusynessNumber back to a label if desired
      let avgBusynessLabel = "";
      if (avgBusynessNumber > 0) {
        if (avgBusynessNumber < 1.5) avgBusynessLabel = "Low";
        else if (avgBusynessNumber < 2.5) avgBusynessLabel = "Moderate";
        else avgBusynessLabel = "High";
      } else {
        avgBusynessLabel = "No Data";
      }

      // 4. Find the most common noise level
      const noiseEntries = Object.entries(noiseCounts); // e.g. [ ["Quiet", 2], ["Moderate", 5], ... ]
      noiseEntries.sort((a, b) => b[1] - a[1]); // sort descending by count
      const topNoise = noiseEntries[0];
      const mostCommonNoise = topNoise && topNoise[1] > 0 ? topNoise[0] : "No Data";

      // 5. Update aggregated data in state
      setAggregatedData((prev) => ({
        ...prev,
        [spotId]: {
          avgBusyness: avgBusynessLabel,
          avgBusynessNumber,
          mostCommonNoise,
        },
      }));
    } catch (error) {
      console.error("Error aggregating check-ins:", error);
    }
  };

  /**
   * This is called after a user successfully submits a check-in.
   * We'll refresh the aggregated data for the currently selected spot.
   */
  const handleCheckInSuccess = (spotId) => {
    fetchAndAggregateCheckIns(spotId);
  };

  // If you want to fetch aggregated data whenever a spot is selected,
  // you can do it in a useEffect that depends on `selectedSpot`.
  useEffect(() => {
    if (selectedSpot) {
      fetchAndAggregateCheckIns(selectedSpot.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpot]);

  if (loading) {
    return <p className="text-center mt-8 text-white">Loading study spots...</p>;
  }

  return (
    <div className="relative w-screen h-screen bg-black">
      <div className="flex h-full">
        {/* Left half: Horizontal scrollable gallery */}
        <div className="w-1/2 h-full p-6">
          <h2 className="text-3xl font-bold text-center mb-6 text-white">
            Public Study Spots Gallery
          </h2>
          <div className="flex overflow-x-auto space-x-4">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="flex-shrink-0 w-64 cursor-pointer"
                onClick={() => setSelectedSpot(spot)}
              >
                <img
                  src={spot.images && spot.images[0]}
                  alt={spot.name}
                  className="w-full h-40 object-cover rounded shadow-sm"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Right half: Additional content or placeholder */}
        <div className="w-1/2 h-full p-6"></div>
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
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl"
                onClick={() => setSelectedSpot(null)}
              >
                &times;
              </button>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Enlarged image */}
                <div className="md:w-1/2">
                  <img
                    src={selectedSpot.images && selectedSpot.images[0]}
                    alt={selectedSpot.name}
                    className="w-full h-auto object-cover rounded"
                  />
                </div>
                {/* Text details and check-in button */}
                <div className="md:w-1/2">
                  <h3 className="text-xl font-bold mb-2">{selectedSpot.name}</h3>
                  <p className="mb-2">{selectedSpot.description}</p>
                  <p className="mb-1">
                    <strong>Building:</strong> {selectedSpot.building}
                  </p>
                  <p className="mb-1">
                    <strong>Indoor:</strong>{" "}
                    {selectedSpot.indoor ? "Yes" : "No"}
                  </p>
                  <p className="mb-1">
                    <strong>Outlets:</strong> {selectedSpot.outlets}
                  </p>
                  <p className="mb-1">
                    <strong>Busyness (M/A/E):</strong>{" "}
                    {selectedSpot.busyMorning} / {selectedSpot.busyAfternoon} /{" "}
                    {selectedSpot.busyEvening}
                  </p>
                  <p className="mb-1">
                    <strong>Dining Options:</strong>{" "}
                    {selectedSpot.diningOptions
                      ? selectedSpot.diningOptions.join(", ")
                      : "N/A"}
                  </p>

                  {/* Display aggregated data if available */}
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
                    </div>
                  )}

                  {/* Check-In Button */}
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

      {/* Render the Check-In Form Modal */}
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
