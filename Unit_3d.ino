#include <SparkFun_VL53L5CX_Library.h>  // Library for the VL53L5CX sensor (LiDAR)
#include <WiFi.h>  // Wi-Fi functionality for connecting to a Wi-Fi network
#include <WiFiClientSecure.h>  // Secure Wi-Fi client (TLS Protocol over HTTPS)
#include <Wire.h>  // I2C library for communication with VL53L5CX sensor

// Wi-Fi credentials
const char* ssid = "CanesGuest";  // Network SSID (Wi-Fi name)

// Firebase settings
const char* host = "seniordesignsensordata.firebaseio.com";  // Firebase Realtime Database URL (no https://)
const char* firebaseSecret = "xbD67oeeBbinWyCux8NwhJNBJmQAyZZZjCrjJfrx";  // Firebase authentication secret

// VL53L5CX sensor settings
#define imageWidth 4  // Width of the LiDAR sensor array (4x4 grid)
int16_t threshold = 1000;  // Distance threshold in millimeters (anything greater will trigger motion)
int16_t cell_array[imageWidth][imageWidth];  // Array to store sensor distance readings

SparkFun_VL53L5CX sensorLR;  // Create an instance of the sensor object
VL53L5CX_ResultsData measurementData;  // Store sensor data from measurements

bool allUnderThreshold = true;  // Flag to track if all cells are under the threshold
int motion = 0;  // Track the motion status (1 for motion left, -1 for motion right)

void setup() 
{
  Serial.begin(115200);  // Start serial communication for debugging

  // Connect to Wi-Fi
  connectToWiFi();

  // Initialize VL53L5CX sensor
  Wire.begin(21, 22);  // Set I2C SDA (21) and SCL (22) pins for communication
  Wire.setClock(400000);  // Set I2C clock speed to 400 kHz (faster communication)
  if(!sensorLR.begin())  // Initialize the sensor
  {
    Serial.println("VL53L5CX failed to initialize");  // If initialization fails, print an error
    while (1);  // Halt execution if sensor initialization fails
  }

  // Configure the sensor
  sensorLR.setResolution(imageWidth * imageWidth);  // Set resolution to 4x4 grid
  sensorLR.setRangingFrequency(15);  // Set frequency for measurements (15 Hz)
  sensorLR.startRanging();  // Start collecting distance measurements
}

void loop() 
{
  // Ensure Wi-Fi is still connected
  if(WiFi.status() != WL_CONNECTED) 
  {
    connectToWiFi();  // If disconnected, reconnect to Wi-Fi
  }

  if(sensorLR.isDataReady())  // Check if new data is ready from the sensor
  {
    if(sensorLR.getRangingData(&measurementData))  // Fetch the latest measurement data
    {
      // Loop through all sensor cells to get distance readings and check if any exceed threshold
      for(int y = 0; y < imageWidth; ++y) 
      {
        for(int x = 0; x < imageWidth; ++x) 
        {
          cell_array[x][y] = measurementData.distance_mm[y * imageWidth + x];  // Store the distance in the array
          if(cell_array[x][y] > threshold)  // Check if any cell's distance exceeds threshold
          {
            allUnderThreshold = false;  // Flag that not all readings are under the threshold
          }
        }
      }

      // If any distance exceeded the threshold, determine motion direction
      if(!allUnderThreshold) 
      {
        int row1 = (imageWidth / 2) - 1;  // The row just above the middle
        int row2 = imageWidth / 2;  // The row just below the middle

        // Check the right side (last two columns in middle rows) for motion detection
        if(cell_array[row1][imageWidth - 1] < threshold ||
            cell_array[row1][imageWidth - 2] < threshold ||
            cell_array[row2][imageWidth - 1] < threshold ||
            cell_array[row2][imageWidth - 2] < threshold) {
          motion = -1;  // Detected motion to the right
        } 
        // Check the left side (first two columns in middle rows) for motion detection
        else if(cell_array[row1][0] < threshold ||
                   cell_array[row1][1] < threshold ||
                   cell_array[row2][0] < threshold ||
                   cell_array[row2][1] < threshold) {
          motion = 1;  // Detected motion to the left
        }
      }

      // If motion is detected, send the status to Firebase
      if(motion != 0) 
      {
        sendToFirebase(motion);  // Send motion data (1 or -1) to Firebase
        motion = 0;  // Reset motion status
        delay(1500);  // Wait for 1.5 seconds to prevent flooding Firebase with too many requests
      }
    }
  }

  delay(5);  // Short delay to allow other tasks to run
}

// Function to connect to Wi-Fi
void connectToWiFi() 
{
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(ssid);  // Start Wi-Fi connection with provided SSID
  int attempts = 0;  // Track connection attempts
  while(WiFi.status() != WL_CONNECTED && attempts < 20) 
  {  
    // Retry for up to 20 attempts if not connected
    delay(500);  // Wait half a second before retrying
    Serial.print(".");  // Print dots to show progress
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) 
  {
    Serial.println("\nConnected to Wi-Fi");  // Notify that the Wi-Fi connection was successful
  } 
  else 
  {
    Serial.println("\nFailed to connect to Wi-Fi. Retrying...");  // Notify if Wi-Fi connection failed
    delay(1000);  // Wait for 1 second before retrying
    connectToWiFi();  // Recursively try to connect again if Wi-Fi fails
  }
}

// Function to send motion status to Firebase
void sendToFirebase(int motionStatus) 
{
  WiFiClientSecure client;  // Secure client for connecting to Firebase (uses TLS)
  client.setInsecure();  // Disable SSL certificate validation for simplicity (this is insecure for production)

  // Try to connect to Firebase on port 443 (HTTPS)
  if(!client.connect(host, 443)) 
  {
    Serial.println("Connection to Firebase failed");  // Print error if connection fails
    return;  // Exit function if unable to connect
  }

  String url = "/3d/LiDAR.json?auth=" + String(firebaseSecret);  // URL to send data to Firebase with the secret for authentication
  String payload = String(motionStatus);  // The motion data (1 or -1)

  // Send data to Firebase
  Serial.println("Sending data to Firebase...");
  client.print(String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + payload.length() + "\r\n\r\n" +
               payload);  // Send HTTP PUT request with motion data in payload

  // Read response from Firebase (optional)
  String response = "";
  while (client.available()) 
  {
    response = client.readStringUntil('\n');  // Read response from Firebase server
    Serial.println("Response from Firebase: ");
    Serial.println(response);  // Print the server response to the serial monitor
  }

  // Close the connection after sending data
  client.stop();

  // Notify that the data has been sent and the connection closed
  Serial.println("Data sent and connection closed.");
}