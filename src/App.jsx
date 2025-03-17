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
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence exitBeforeEnter>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/loading" element={<LoadingPage />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/studySpots" element={<StudySpots />} />
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/SpaceHomePage" element={<SpaceHomePage />} />
        <Route path="/TestFilteringPage" element={<TestFilteringPage />} />
        <Route path="/StudySpotsGallery" element={<StudySpotsGallery />} />
        <Route path="/CampusCalendarPage" element={<CampusCalendarPage />} />
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
