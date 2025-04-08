import React, { useState, useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { db } from "../firebase/firebaseConfig";
import { collection, query, getDocs } from "firebase/firestore";

export default function DirectionsPage() {
  const [studySpot, setStudySpot] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [map, setMap] = useState(null);

  // Fetch study spot data from Firestore
  useEffect(() => {
    async function fetchStudySpot() {
      try {
        // Use exact collection name: "studySpots"
        const studySpotsRef = collection(db, "studySpots");
        const q = query(studySpotsRef);
        const snapshot = await getDocs(q);
        const spots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched study spots:", spots);

        if (spots.length > 0) {
          const firstSpot = spots[0];
          // Adjust property names according to your Firestore structure:
          // For example, if the document has "Location" with nested "coordinates" having "lat" and "long"
          if (
            firstSpot.location &&
            firstSpot.location.coordinates &&
            firstSpot.location.coordinates.lat &&
            firstSpot.location.coordinates.lng
          ) {
            setStudySpot({ 
              lat: firstSpot.location.coordinates.lat, 
              lng: firstSpot.location.coordinates.lng 
            });
          } else {
            console.error("Document structure is unexpected:", firstSpot);
          }
        } else {
          console.error("No study spots found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching study spot:", error);
      }
    }
    fetchStudySpot();
  }, []);

  // Get user's current location using the browser's geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation([
            position.coords.latitude,
            position.coords.longitude
          ]);
        },
        (error) => {
          console.error("Error getting user location:", error);
          // Fallback to a default location (London) if user denies geolocation
          setCurrentLocation([51.505, -0.09]);
        }
      );
    } else {
      setCurrentLocation([51.505, -0.09]);
    }
  }, []);

  // Set up routing control once map, current location, and study spot are available
  useEffect(() => {
    if (map && currentLocation && studySpot) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(currentLocation[0], currentLocation[1]),
          L.latLng(studySpot.lat, studySpot.lng)
        ],
        routeWhileDragging: true,
        createMarker: function(i, waypoint, nWps) {
          // For i=0 (start) and i=1 (end), create a marker with a popup
          const marker = L.marker(waypoint.latLng);
          if (i === 0) {
            marker.bindPopup("Your Location").openPopup();
          } else if (i === 1) {
            marker.bindPopup("Study Spot").openPopup();
          }
          return marker;
        }
      }).addTo(map);

      return () => {
        map.removeControl(routingControl);
      };
    }
  }, [map, currentLocation, studySpot]);

  return (
    <div>
      <h2>Directions to Your Study Spot</h2>
      {studySpot ? (
        <MapContainer
          center={currentLocation || [studySpot.lat, studySpot.lng]}
          zoom={13}
          whenCreated={setMap}
          style={{ height: "600px", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          {/* Optional explicit markers (the routing control already adds markers by default)
              Uncomment these if you want additional markers or custom styling */}
          {currentLocation && (
            <Marker position={currentLocation}>
              <Popup>Your Location</Popup>
            </Marker>
          )}
          {studySpot && (
            <Marker position={[studySpot.lat, studySpot.lng]}>
              <Popup>Study Spot</Popup>
            </Marker>
          )}
        </MapContainer>
      ) : (
        <p>Loading study spot data...</p>
      )}
    </div>
  );
}
