#include <SparkFun_VL53L5CX_Library.h>  // Library for VL53L5CX distance sensor
#include <WiFi.h>                      // Wi-Fi library for ESP32
#include <WiFiClientSecure.h>           // Secure Wi-Fi connection for Firebase (TLS Protocol over HTTPS)
#include <Wire.h>                       // I2C communication library
#include <esp_wifi.h>                   // ESP32 Wi-Fi settings
#include <esp_wifi_types.h>             // Defines Wi-Fi types for ESP32
#include <esp_system.h>                 // ESP32 system functions
#include <map>                          // To use map containers for storing MACs
#include <vector>                       // To use vector containers for storing MAC count history

// Wi-Fi credentials
const char* ssid = "CanesGuest";      // Wi-Fi SSID

// Firebase settings
const char* host = "seniordesignsensordata.firebaseio.com";  // Firebase database URL (without https://)
const char* firebaseSecret = "xbD67oeeBbinWyCux8NwhJNBJmQAyZZZjCrjJfrx";  // Firebase secret for authentication

// VL53L5CX sensor settings
#define imageWidth 8                  // LiDAR image width (8x8 grid)
int16_t threshold = 1000;            // Distance threshold for detecting objects
int16_t cell_array[imageWidth][imageWidth];  // Stores distance data from the sensor

SparkFun_VL53L5CX sensorRL;           // Sensor object
VL53L5CX_ResultsData measurementData; // Sensor measurement data

// Sniffer settings
int RSSI_THRESHOLD = -70;             // Minimum RSSI (signal strength) for considering Wi-Fi packets
#define MAC_EXPIRY_TIME 90000         // MAC expiry time in milliseconds (30 seconds)
#define MIN_APPEARANCE_COUNT 3       // Minimum appearance count for a MAC to be considered valid
#define SCAN_INTERVAL 500            // Interval between Wi-Fi scan updates (in milliseconds, 0.5 seconds)
#define CHANNEL_HOP_INTERVAL 3       // Time to hop to the next Wi-Fi channel (in seconds)
#define AVERAGE_TIME_WINDOW 30000    // Time window (in milliseconds) for calculating the MAC count average

bool allUnderThreshold = true;        // Flag to check if all LiDAR readings are under threshold
int motion = 0;                       // Stores motion status (-1 = left, 1 = right, 0 = no motion)

// Store unique MAC addresses and metadata
struct MacEntry
{
  unsigned long lastSeen;  // Time when this MAC was last seen
  int count;               // Count of how many times this MAC has been seen
  int rssi;                // RSSI (signal strength) of the last seen packet
};

std::map<String, MacEntry> macAddressMap;   // Map to store MAC address as key and metadata as value
int currentChannel = 1;                     // Current Wi-Fi channel for sniffing

// To track the count of unique MACs for the average
std::vector<int> macCountHistory;   // Store MAC counts for averaging over time

// Define the MAC header struct manually for parsing 802.11 Wi-Fi packets
typedef struct 
{
  unsigned frame_ctrl : 16;
  unsigned duration_id : 16;
  uint8_t addr1[6]; // Receiver address
  uint8_t addr2[6]; // Sender address (this is the MAC address we are interested in)
  uint8_t addr3[6]; // Filtering address (not used here)
  unsigned sequence_ctrl : 16;
  uint8_t addr4[6];
} wifi_ieee80211_mac_hdr_t;

void setup() 
{
  Serial.begin(115200);  // Start serial communication for debugging

  // Initialize the VL53L5CX distance sensor over I2C
  Wire.begin(21, 22);    // I2C pins for SDA (21) and SCL (22) on ESP32
  Wire.setClock(400000);  // Set I2C clock speed to 400kHz (faster communication)
  if(!sensorRL.begin())  // Initialize the sensor
  {
    Serial.println("VL53L5CX failed to initialize");  // Print error if initialization fails
    while(1);  // Stay in an infinite loop if sensor fails to initialize
  }

  // Set the ESP32 Wi-Fi mode to Station (not Access Point)
  WiFi.mode(WIFI_MODE_STA);
  esp_wifi_set_promiscuous(true);  // Enable promiscuous mode (listening to all Wi-Fi packets)
  esp_wifi_set_promiscuous_rx_cb(&sniffer_callback);  // Set callback function for packet processing
  esp_wifi_set_channel(currentChannel, WIFI_SECOND_CHAN_NONE);  // Set Wi-Fi channel for sniffing
  
  // Initialize the VL53L5CX sensor settings
  sensorRL.setResolution(imageWidth * imageWidth);  // Set sensor resolution (8x8 grid)
  sensorRL.setRangingFrequency(15);  // Set ranging frequency to 15 Hz
  sensorRL.startRanging();  // Start the distance measurement
}

void loop() 
{
  static unsigned long lastUpdateTime = 0;  // Last update time for MAC address scanning
  static unsigned long lastChannelHop = 0;  // Last time Wi-Fi channel was changed
  static unsigned long lastAverageTime = 0;  // Last time MAC address count average was calculated
  unsigned long currentTime = millis();  // Get the current time in milliseconds

  // Periodically update the MAC count every 0.5 seconds
  if(currentTime - lastUpdateTime > SCAN_INTERVAL)
  {
    lastUpdateTime = currentTime;
    cleanExpiredMACs();  // Clean up expired MAC addresses

    int validMacCount = 0;
    for(const auto& entry : macAddressMap)  // Loop through stored MAC addresses
    {
      if(entry.second.count >= MIN_APPEARANCE_COUNT)  // Only consider MACs that have been seen at least 'MIN_APPEARANCE_COUNT' times
      {
        validMacCount++;
      }
    }

    // Store the current valid MAC count for averaging
    macCountHistory.push_back(validMacCount);

    // Remove counts older than the AVERAGE_TIME_WINDOW
    while(!macCountHistory.empty() && (currentTime - lastUpdateTime > AVERAGE_TIME_WINDOW))
    {
      macCountHistory.erase(macCountHistory.begin());  // Remove the oldest count from history
    }
  }

  // Calculate the average of the last 30 seconds' MAC counts every 30 seconds
  if(currentTime - lastAverageTime > AVERAGE_TIME_WINDOW)
  {
    lastAverageTime = currentTime;

    // Calculate the sum of the valid MAC counts
    int sum = 0;
    for(int count : macCountHistory)
    {
      sum += count;
    }

    // Calculate the average MAC count
    int averageMacCount = (macCountHistory.empty()) ? 0 : sum / macCountHistory.size();

    // Send the average MAC count to Firebase
    sendToFirebaseW(averageMacCount);
  }

  // Wi-Fi channel hopping to detect more devices
  if(currentTime - lastChannelHop > (CHANNEL_HOP_INTERVAL * 1000))
  {
    hopToNextChannel();  // Hop to the next Wi-Fi channel
    lastChannelHop = currentTime;
  }
  
  // LiDAR sensor data processing
  if(sensorRL.isDataReady())  // Check if the sensor has new data
  {
    if(sensorRL.getRangingData(&measurementData))  // Get the ranging data
    {
      // Process the distance data and check for motion
      for(int y = 0; y < imageWidth; ++y) 
      {
        for(int x = 0; x < imageWidth; ++x) 
        {
          cell_array[x][y] = measurementData.distance_mm[y * imageWidth + x];
          if(cell_array[x][y] > threshold)  // If distance is above threshold, motion is detected
          {
            allUnderThreshold = false;
          }
        }
      }

      // Check specific positions for motion detection
      if(!allUnderThreshold) 
      {
        int row1 = (imageWidth / 2) - 1;
        int row2 = imageWidth / 2;

        // Check if motion is detected based on specific cells
        if(cell_array[row1][imageWidth - 1] < threshold || 
           cell_array[row1][imageWidth - 2] < threshold || 
           cell_array[row2][imageWidth - 1] < threshold || 
           cell_array[row2][imageWidth - 2] < threshold) 
        {
          motion = 1;  // Right motion detected
        } 
        else if(cell_array[row1][0] < threshold || 
                cell_array[row1][1] < threshold || 
                cell_array[row2][0] < threshold || 
                cell_array[row2][1] < threshold) 
        {
          motion = -1;  // Left motion detected
        }
      }

      // Send the motion data to Firebase and reset motion status
      if(motion != 0) 
      {
        sendToFirebaseL(motion);
        motion = 0;
        delay(1500);  // Debounce the motion sensor
      }
    }
  }
}

// Callback function to process sniffed Wi-Fi packets
void sniffer_callback(void* buf, wifi_promiscuous_pkt_type_t type)
{
  if(type != WIFI_PKT_MGMT && type != WIFI_PKT_DATA) return;  // Ignore non-management/data packets

  const wifi_promiscuous_pkt_t* pkt = (wifi_promiscuous_pkt_t*)buf;
  if(pkt->payload == nullptr) return;  // Ignore packets with no payload

  const wifi_ieee80211_mac_hdr_t* hdr = (wifi_ieee80211_mac_hdr_t*)pkt->payload;
  String mac_address = macToString(hdr->addr2);  // Extract MAC address (sender address)
  int rssi = pkt->rx_ctrl.rssi;  // Get the RSSI (signal strength) of the packet

  // Ignore packets with weak signal strength (below threshold)
  if(rssi < RSSI_THRESHOLD) return;

  unsigned long currentTime = millis();  // Get current time for tracking when MAC was last seen

  // Update or add MAC address entry in the map
  auto it = macAddressMap.find(mac_address);
  if(it != macAddressMap.end())
  {
    it->second.lastSeen = currentTime;  // Update last seen time
    it->second.count++;  // Increment count for the MAC address
    it->second.rssi = rssi;  // Update RSSI
  }
  else
  {
    macAddressMap[mac_address] = {currentTime, 1, rssi};  // Add new MAC address to map
  }
}

// Helper function to clean up expired MAC addresses from the map
void cleanExpiredMACs()
{
  unsigned long currentTime = millis();  // Get the current time
  for(auto it = macAddressMap.begin(); it != macAddressMap.end(); )
  {
    if(currentTime - it->second.lastSeen > MAC_EXPIRY_TIME)  // Check if MAC is expired
    {
      it = macAddressMap.erase(it);  // Remove expired MAC entry
    }
    else
    {
      ++it;  // Move to the next MAC address
    }
  }
}

// Helper function to convert MAC address (byte array) to string
String macToString(const uint8_t* mac)
{
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(macStr);
}

// Function to hop Wi-Fi channels (1-13) for scanning
void hopToNextChannel()
{
  currentChannel = (currentChannel % 11) + 1;  // Loop through channels 1-11
  esp_wifi_set_channel(currentChannel, WIFI_SECOND_CHAN_NONE);  // Set the new channel
}

// Function to connect to Wi-Fi
void connectToWiFi() 
{
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  int attempts = 0;
  while(WiFi.status() != WL_CONNECTED && attempts < 20)  // Retry up to 20 attempts
  {  
    delay(150);  // Retry every 150 ms
    Serial.print(".");
    attempts++;
  }
  if(WiFi.status() == WL_CONNECTED) 
  {
    Serial.println("\nConnected to Wi-Fi");
  } 
  else 
  {
    Serial.println("\nFailed to connect to Wi-Fi. Retrying...");
    delay(150);  // Retry delay before trying again
    connectToWiFi();  // Retry connecting to Wi-Fi
  }
}

// Function to send motion data to Firebase (LiDAR motion detection)
void sendToFirebaseL(int motionStatus) 
{
  // Disable promiscuous mode for secure communication
  esp_wifi_set_promiscuous(false); 
  connectToWiFi();  // Connect to Wi-Fi
  WiFiClientSecure client;
  client.setInsecure();  // Disable SSL certificate validation for simplicity

  // Check if client can connect to Firebase
  if(!client.connect(host, 443)) 
  {
    Serial.println("Connection to Firebase failed");
    return;
  }

  String url = "/1b/LiDAR.json?auth=" + String(firebaseSecret);
  String payload = String(motionStatus);  // Create payload with motion status

  // Send data to Firebase using HTTP PUT method
  client.print(String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + payload.length() + "\r\n\r\n" +
               payload);

  // Read and print the response from Firebase for debugging
  String response = "";
  while(client.available()) 
  {
    response = client.readStringUntil('\n');
    Serial.println("Response from Firebase: ");
    Serial.println(response);
  }

  // Close the client connection
  client.stop();
  Serial.println("Data sent and connection closed.");
  
  // Re-enable promiscuous mode after data sent
  esp_wifi_set_promiscuous(true);  
  esp_wifi_set_promiscuous_rx_cb(&sniffer_callback);  // Reset sniffer callback
  esp_wifi_set_channel(currentChannel, WIFI_SECOND_CHAN_NONE);  // Reset Wi-Fi channel
}

// Function to send Wi-Fi MAC count to Firebase
void sendToFirebaseW(int validMacCount) 
{
  // Disable promiscuous mode for secure communication
  esp_wifi_set_promiscuous(false); 
  connectToWiFi();  // Connect to Wi-Fi
  WiFiClientSecure client;
  client.setInsecure();  // Disable SSL certificate validation for simplicity

  // Check if client can connect to Firebase
  if(!client.connect(host, 443)) 
  {
    Serial.println("Connection to Firebase failed");
    return;
  }

  String url = "/1b/macCount.json?auth=" + String(firebaseSecret);
  String payload = String(validMacCount);  // Create payload with valid MAC count

  // Send data to Firebase using HTTP PUT method
  client.print(String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + payload.length() + "\r\n\r\n" +
               payload);

  // Read and print the response from Firebase for debugging
  String response = "";
  while(client.available()) 
  {
    response = client.readStringUntil('\n');
    Serial.println("Response from Firebase: ");
    Serial.println(response);
  }

  // Close the client connection
  client.stop();
  Serial.println("Data sent and connection closed.");
  
  // Re-enable promiscuous mode after data sent
  esp_wifi_set_promiscuous(true);  
  esp_wifi_set_promiscuous_rx_cb(&sniffer_callback);  // Reset sniffer callback
  esp_wifi_set_channel(currentChannel, WIFI_SECOND_CHAN_NONE);  // Reset Wi-Fi channel
}