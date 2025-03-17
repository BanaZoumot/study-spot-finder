// src/pages/CampusCalendarPage.jsx
import React, { useState, useEffect } from 'react';
import ICAL from 'ical.js';
import { motion } from 'framer-motion';

export default function CampusCalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCalendar() {
      try {
        // Replace with your actual iCal feed URL
        const feedUrl = 'events.ics';
        const response = await fetch(feedUrl);
        const text = await response.text();
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        const eventList = vevents.map((vevent) => {
          const event = new ICAL.Event(vevent);
          return {
            summary: event.summary,
            description: event.description,
            location: event.location,
            startDate: event.startDate.toString(),
            endDate: event.endDate.toString(),
          };
        });
        setEvents(eventList);
      } catch (error) {
        console.error('Error fetching calendar:', error);
        setError('Failed to load campus events.');
      } finally {
        setLoading(false);
      }
    }
    fetchCalendar();
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-gray-100 p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold text-center mb-4">
        Campus Events & Study Opportunities
      </h1>
      <p className="text-center mb-8">
        Plan your study sessions around campus happenings. Check out live updates on classroom availabilities, special events, and other opportunities that can help you choose the perfect study spot.
      </p>
      {loading && <p className="text-center">Loading events...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && (
        <ul className="space-y-4">
          {events.length > 0 ? (
            events.map((ev, index) => (
              <li key={index} className="bg-white p-4 rounded shadow">
                <h2 className="text-xl font-semibold">{ev.summary}</h2>
                <p className="text-gray-600">
                  {ev.startDate} - {ev.endDate}
                </p>
                {ev.location && <p className="italic">{ev.location}</p>}
                {ev.description && <p className="mt-2">{ev.description}</p>}
              </li>
            ))
          ) : (
            <p className="text-center">No events available at the moment.</p>
          )}
        </ul>
      )}
    </motion.div>
  );
}
