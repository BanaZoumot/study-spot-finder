import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import HomePage from "./pages/HomePage";
import LoadingPage from "./pages/LoadingPage";
import ClassesPage from "./pages/ClassesPage";
import StudySpots from "./pages/StudySpots";
import LandingPage from "./pages/LandingPage";
import SpaceHomePage from "./pages/SpaceHomePage";
import TestFilteringPage from "./pages/TestFilteringPage";
import StudySpotsGallery from "./pages/StudySpotsGallery";
import CampusCalendarPage from "./pages/CampusCalendarPage";
import LoadingStudySpotsPage from "./pages/LoadingStudySpotsPage";
import StudySpotsPage from "./pages/StudySpotsPage";
import SensorDataPage from "./pages/SensorDataPage"; // Import the new SensorDataPage component
import IntroPage from "./pages/IntroPage"; // Import the IntroPage component
import DirectionsPage from "./pages/DirectionsPage";
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence exitBeforeEnter>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<IntroPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/studySpots" element={<StudySpots />} />
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/SpaceHomePage" element={<SpaceHomePage />} />
        <Route path="/TestFilteringPage" element={<TestFilteringPage />} />
        <Route path="/StudySpotsGallery" element={<StudySpotsGallery />} />
        <Route path="/CampusCalendarPage" element={<CampusCalendarPage />} />
        <Route path="/loading-study-spots" element={<LoadingStudySpotsPage />} />
        <Route path="/StudySpotsPage" element={<StudySpotsPage />} />
        <Route path="/SensorDataPage" element={<SensorDataPage />} /> 
        <Route path="/IntroPage" element={<IntroPage />} /> 
        <Route path="/DirectionsPage" element={<DirectionsPage />} />
      
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
