#include "Adafruit_VL53L1X.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>

// Wi-Fi credentials
const char* ssid = "CanesGuest";

// Firebase settings
const char* host = "seniordesignsensordata.firebaseio.com";  // without https://
const char* firebaseSecret = "xbD67oeeBbinWyCux8NwhJNBJmQAyZZZjCrjJfrx";  // Firebase secret

#define THRESHOLD 800
#define SDA_PIN 21
#define SCL_PIN 22
Adafruit_VL53L1X vl53;
int16_t distance;

void setup() 
{
  Serial.begin(115200);
  Wire.begin(SDA_PIN, SCL_PIN);

  // Connect to Wi-Fi
  connectToWiFi();
  vl53.begin(0x29, &Wire);
  vl53.startRanging();
  vl53.setTimingBudget(15);
}

void loop() {
  if (vl53.dataReady()) {
    distance = vl53.distance();
    if(distance < THRESHOLD)
    {
      sendToFirebase(-1);
      sendToFirebase(0);
      //Serial.println(-1);
      delay(300);
    }
    vl53.clearInterrupt();
  }
}

void connectToWiFi() 
{
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(ssid);
  int attempts = 0;
  while(WiFi.status() != WL_CONNECTED && attempts < 20) 
  {  // Retry for 20 attempts
    delay(150);
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
    delay(1000);  // Retry delay before trying again
    connectToWiFi();
  }
}

void sendToFirebase(int motionStatus) 
{
  WiFiClientSecure client;
  client.setInsecure();  // Disable SSL cert validation for simplicity

  // Check if client can connect to Firebase
  if(!client.connect(host, 443)) 
  {
    Serial.println("Connection to Firebase failed");
    return;
  }

  String url = "/3c/LiDAR.json?auth=" + String(firebaseSecret);
  String payload = String(motionStatus);

  // Send data to Firebase
  Serial.println("Sending data to Firebase...");
  client.print(String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + payload.length() + "\r\n\r\n" +
               payload);

  /*
  // Read response from Firebase
  String response = "";
  while(client.available()) 
  {
    response = client.readStringUntil('\n');
    Serial.println("Response from Firebase: ");
    Serial.println(response);  // This should give us more info on what Firebase is returning
  }

  // Debug: Print the URL and the payload to the Serial Monitor
  Serial.print("URL: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);
  */
  // Close the client connection after sending data
  client.stop();
  // Debug: Notify that the data was sent and the connection was closed
  //Serial.println("Data sent and connection closed.");
}