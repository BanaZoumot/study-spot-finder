import React, { useState } from "react";
import { motion } from "framer-motion";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const CheckInForm = ({ spotId, onClose, onCheckInSuccess }) => {
  const [busyness, setBusyness] = useState("");
  const [noise, setNoise] = useState("");
  const [wifiSpeed, setWifiSpeed] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, "checkIns"), {
        spotId,
        busyness,
        noise,
        wifiSpeed,
        comment,
        createdAt: serverTimestamp(),
      });
      onCheckInSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting check-in:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white p-6 rounded shadow-lg w-11/12 max-w-md relative"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 className="text-xl font-bold mb-4">Check In</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1">How busy was the spot?</label>
            <select
              value={busyness}
              onChange={(e) => setBusyness(e.target.value)}
              required
              className="w-full border rounded p-2"
            >
              <option value="">Select busyness</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Noise Level</label>
            <select
              value={noise}
              onChange={(e) => setNoise(e.target.value)}
              required
              className="w-full border rounded p-2"
            >
              <option value="">Select noise level</option>
              <option value="Quiet">Quiet</option>
              <option value="Moderate">Moderate</option>
              <option value="Loud">Loud</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Wi‑Fi Speed</label>
            <select
              value={wifiSpeed}
              onChange={(e) => setWifiSpeed(e.target.value)}
              required
              className="w-full border rounded p-2"
            >
              <option value="">Select Wi‑Fi speed</option>
              <option value="Slow">Slow</option>
              <option value="Average">Average</option>
              <option value="Fast">Fast</option>
              <option value="Excellent">Excellent</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block mb-1">Additional Comments (optional):</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts or suggestions..."
              className="w-full border rounded p-2"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600 transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Check-In"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CheckInForm;
