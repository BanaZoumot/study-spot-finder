// src/pages/IntroPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function IntroPage() {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);

  // After 2 seconds, trigger the fade-out animation on the circle
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="relative w-screen h-screen"
      style={{
        backgroundImage: "url('/umvillage.png')", // Same background as LandingPage
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}

      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
          {/* Black overlay */}
      <div className="absolute inset-0 bg-black/55"></div>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="rounded-full bg-black/50 text-white flex items-center justify-center text-xl font-light font-sans"
          style={{ width: 150, height: 150 }}
          initial={{ opacity: 1 }}
          animate={fadeOut ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 1 }}
          onAnimationComplete={() => {
            if (fadeOut) {
              navigate("/LandingPage");
            }
          }}
        >
          FASTPASS
        </motion.div>
      </div>
    </motion.div>
  );
}
