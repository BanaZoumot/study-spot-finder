import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';



const MapComponent = ({ studySpot }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [map, setMap] = useState(null);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation([position.coords.latitude, position.coords.longitude]);
      });
    } else {
      // Fallback location if geolocation is not available
      setCurrentLocation([51.505, -0.09]);
    }
  }, []);

  // Set up routing once map, user location, and study spot are available
  useEffect(() => {
    if (map && currentLocation && studySpot) {
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(currentLocation[0], currentLocation[1]),
          L.latLng(studySpot.lat, studySpot.lng)
        ],
        routeWhileDragging: true
      }).addTo(map);

      // Cleanup function to remove the routing control when component unmounts or updates
      return () => {
        map.removeControl(routingControl);
      };
    }
  }, [map, currentLocation, studySpot]);

  return (
    <MapContainer
      center={currentLocation || [51.505, -0.09]}
      zoom={13}
      whenCreated={setMap}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
    </MapContainer>
  );
};

export default MapComponent;
