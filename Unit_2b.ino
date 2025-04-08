#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <Wire.h>
#include<esp_wifi.h>
#include <esp_wifi_types.h>
#include <esp_system.h>
#include <freertos/FreeRTOS.h>
#include <map>
#include <vector>
#include <Arduino.h>
#include <driver/i2s.h>
#include <arduinoFFT.h>
#include <math.h>

// Wi-Fi credentials
const char* ssid = "CanesGuest";

// Firebase settings
const char* host = "seniordesignsensordata.firebaseio.com";  // without https://
const char* firebaseSecret = "xbD67oeeBbinWyCux8NwhJNBJmQAyZZZjCrjJfrx";  // Firebase secret

// Sniffer settings
int RSSI_THRESHOLD = -70;        // Range
#define MAC_EXPIRY_TIME 90000     // Remove MACs after 30 sec of inactivity
#define MIN_APPEARANCE_COUNT 3   // Ignore MACs seen fewer than 3 times (likely random)
#define SCAN_INTERVAL 500        // Time between updates (in milliseconds, 0.5 seconds)
#define CHANNEL_HOP_INTERVAL 3   // Switch Wi-Fi channels every 60 seconds
#define AVERAGE_TIME_WINDOW 30000  // 30 seconds for average

// Microphone Settings
#define SAMPLES 1024
#define SAMPLING_FREQUENCY 44100
#define MIN_SPEECH_FREQ 100
#define MAX_SPEECH_FREQ 5000
#define I2S_WS 25
#define I2S_SD 33
#define I2S_SCK 32
#define I2S_PORT I2S_NUM_0
#define RMS_THRESHOLD 100.0
#define SPECTRAL_FLATNESS_THRESHOLD 0.4
#define SMOOTHING_FACTOR 0.1
#define AVG_SPAN 30000 // 30 seconds in milliseconds
int16_t sBuffer[SAMPLES];
float vReal[SAMPLES];
float vImag[SAMPLES];
float smoothedRms = 0;
float dbSum = 0;
int dbCount = 0;
unsigned long startTime = 0;
ArduinoFFT<float> FFT = ArduinoFFT<float>(vReal, vImag, SAMPLES, SAMPLING_FREQUENCY, false);

// Store unique MAC addresses and metadata
struct MacEntry
{
  unsigned long lastSeen;
  int count;
  int rssi;
};

std::map<String, MacEntry> macAddressMap;
int currentChannel = 1;

// To track the count of unique MACs for the average
std::vector<int> macCountHistory;   // Store MAC counts for averaging


// Define the MAC header struct manually
typedef struct 
{
  unsigned frame_ctrl : 16;
  unsigned duration_id : 16;
  uint8_t addr1[6]; // Receiver address
  uint8_t addr2[6]; // Sender address
  uint8_t addr3[6]; // Filtering address
  unsigned sequence_ctrl : 16;
  uint8_t addr4[6];
} wifi_ieee80211_mac_hdr_t;

float calculateRMS(float* signal, int startIndex, int endIndex) 
{
  double sum = 0.0;
  int count = 0;
  int startBin = (int)((float)startIndex * SAMPLES / SAMPLING_FREQUENCY);
  int endBin = (int)((float)endIndex * SAMPLES / SAMPLING_FREQUENCY);

  for(int i = startBin; i < endBin && i < SAMPLES / 2; i++) 
  {
    sum += signal[i] * signal[i];
    count++;
  }

  if(count == 0) return 0.0;
  return sqrt(sum / count);
}

float calculateSpectralFlatness(float* signal, int startIndex, int endIndex) 
{
  double geometricMean = 1.0;
  double arithmeticMean = 0.0;
  int count = 0;
  float epsilon = 1e-9;

  int startBin = (int)((float)startIndex * SAMPLES / SAMPLING_FREQUENCY);
  int endBin = (int)((float)endIndex * SAMPLES / SAMPLING_FREQUENCY);

  for(int i = startBin; i < endBin && i < SAMPLES / 2; i++) 
  {
    if(signal[i] > 0.0) 
    {
      geometricMean *= signal[i];
      arithmeticMean += signal[i];
      count++;
    }
  }

  if(count == 0) return 0.0;

  geometricMean = pow(geometricMean, 1.0 / count);
  arithmeticMean /= count;

  if(arithmeticMean < epsilon) 
  {
    return 0.0;
  }

  return geometricMean / arithmeticMean;
}

void i2s_install() 
{
  const i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLING_FREQUENCY,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = 0,
    .dma_buf_count = 8,
    .dma_buf_len = SAMPLES,
    .use_apll = false
  };

  esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  if(err != ESP_OK) 
  {
    Serial.print("I2S driver installation failed: ");
    Serial.println(esp_err_to_name(err));
  } 
  else 
  {
    Serial.println("I2S driver installed successfully.");
  }
}

void i2s_setpin() 
{
  const i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num = I2S_WS,
    .data_out_num = -1,
    .data_in_num = I2S_SD
  };

  esp_err_t err = i2s_set_pin(I2S_PORT, &pin_config);
  if(err != ESP_OK) 
  {
    Serial.print("Failed to set I2S pins: ");
    Serial.println(esp_err_to_name(err));
  } 
  else 
  {
    Serial.println("I2S pins set successfully.");
  }
}


void setup() 
{
  Serial.begin(115200);
  delay(500);

  i2s_install();
  i2s_setpin();
  i2s_start(I2S_PORT);
  delay(500);

  WiFi.mode(WIFI_MODE_STA); // Set ESP32 as a station
  esp_wifi_set_promiscuous(true); // Enable promiscuous mode
  esp_wifi_set_promiscuous_rx_cb(&sniffer_callback);  // Set the callback function
  esp_wifi_set_channel(currentChannel, WIFI_SECOND_CHAN_NONE);  // Set WiFi channel
  //Serial.println("WiFi Sniffer Initialized.");
}

void loop() 
{
  // Wi-Fi Sniffing Portion
  static unsigned long lastUpdateTime = 0;
  static unsigned long lastChannelHop = 0;
  static unsigned long lastAverageTime = 0;  // Track when to calculate the average
  unsigned long currentTime = millis();

  // Periodically update unique MAC count every 0.5 seconds
  if(currentTime - lastUpdateTime > SCAN_INTERVAL)
  {
    lastUpdateTime = currentTime;
    cleanExpiredMACs();

    int validMacCount = 0;
    for(const auto& entry : macAddressMap)
    {
      if(entry.second.count >= MIN_APPEARANCE_COUNT)
      {
        validMacCount++;
      }
    }

    // Store the count for averaging
    macCountHistory.push_back(validMacCount);

    // Remove counts older than 30 seconds (the AVERAGE_TIME_WINDOW)
    while(!macCountHistory.empty() && (currentTime - lastUpdateTime > AVERAGE_TIME_WINDOW))
    {
      macCountHistory.erase(macCountHistory.begin()); // Remove old counts
    }
  }

  // Calculate the average of MAC addresses seen in the last 30 seconds every 30 seconds
  if(currentTime - lastAverageTime > AVERAGE_TIME_WINDOW)
  {
    lastAverageTime = currentTime;

    // Calculate the average of the last 30 seconds' worth of counts
    int sum = 0;
    for (int count : macCountHistory)
    {
      sum += count;
    }

    int averageMacCount = (macCountHistory.empty()) ? 0 : sum / macCountHistory.size();

    // Print the average number of MAC addresses found in the last 30 seconds
    sendToFirebaseW(averageMacCount);
  }

  // Channel hopping to detect more devices
  if(currentTime - lastChannelHop > (CHANNEL_HOP_INTERVAL * 1000))
  {
    hopToNextChannel();
    lastChannelHop = currentTime;
  }


  // Microphone Portion
  size_t bytesRead = 0;
  esp_err_t result = i2s_read(I2S_PORT, sBuffer, sizeof(sBuffer), &bytesRead, portMAX_DELAY);

  if(result == ESP_OK && bytesRead > 0) 
  {
    for(int i = 0; i < SAMPLES; i++) 
    {
      vReal[i] = (float)sBuffer[i];
      vImag[i] = 0;
    }

    FFT.windowing(vReal, SAMPLES, FFT_WIN_TYP_HAMMING, FFT_FORWARD);
    FFT.compute(vReal, vImag, SAMPLES, FFT_FORWARD);
    FFT.complexToMagnitude(vReal, vImag, SAMPLES);

    float rms = calculateRMS(vReal, MIN_SPEECH_FREQ, MAX_SPEECH_FREQ);
    float spectralFlatness = calculateSpectralFlatness(vReal, MIN_SPEECH_FREQ, MAX_SPEECH_FREQ);

    smoothedRms = (SMOOTHING_FACTOR * rms) + ((1.0 - SMOOTHING_FACTOR) * smoothedRms);
    float db = 20 * log10(smoothedRms + 1);

    if(smoothedRms > RMS_THRESHOLD && spectralFlatness < SPECTRAL_FLATNESS_THRESHOLD) 
    {
      dbSum += db;
      dbCount++;
      if(startTime == 0) 
      {
        startTime = millis();
      }

      if(millis() - startTime >= AVG_SPAN) 
      {
        if(dbCount > 0) 
        {
          float averageDb = dbSum / dbCount;
          sendToFirebaseM(averageDb);
          //Serial.print("Average dB over 30 seconds (Speech Only): ");
          //Serial.println(averageDb);
        } 
        else 
        {
          Serial.println("No speech detected during 30 seconds.");
        }
        dbSum = 0;
        dbCount = 0;
        startTime = millis();
      }
    } 
  }
}

// Callback function to process packets
void sniffer_callback(void* buf, wifi_promiscuous_pkt_type_t type)
{
  if(type != WIFI_PKT_MGMT && type != WIFI_PKT_DATA) return;  // Ignore control packets

  const wifi_promiscuous_pkt_t* pkt = (wifi_promiscuous_pkt_t*)buf;
  if(pkt->payload == nullptr) return; 

  const wifi_ieee80211_mac_hdr_t* hdr = (wifi_ieee80211_mac_hdr_t*)pkt->payload;
  String mac_address = macToString(hdr->addr2);   // Extract sender MAC address
  int rssi = pkt->rx_ctrl.rssi;

  // Ignore weak signals
  if(rssi < RSSI_THRESHOLD) return;

  unsigned long currentTime = millis();

  // Update MAC address data or add if new
  auto it = macAddressMap.find(mac_address);
  if(it != macAddressMap.end())
  {
    it->second.lastSeen = currentTime;
    it->second.count++;
    it->second.rssi = rssi;   // Update RSSI
  }
  else
  {
    macAddressMap[mac_address] = {currentTime, 1, rssi};
  }
}

// Helper function to clean up expired MAC addresses
void cleanExpiredMACs()
{
  unsigned long currentTime = millis();
  for(auto it = macAddressMap.begin(); it != macAddressMap.end(); )
  {
    if(currentTime - it->second.lastSeen > MAC_EXPIRY_TIME)
    {
      it = macAddressMap.erase(it);   // Remove expired entries
    }
    else
    {
      ++it;
    }
  }
}

// Helper function to convert MAC address to string
String macToString(const uint8_t* mac)
{
  char macStr[18];
  snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(macStr);
}

// Function to hop Wi-Fi channels (1-13)
void hopToNextChannel()
{
  currentChannel = (currentChannel % 11) + 1;
  esp_wifi_set_channel(currentChannel, WIFI_SECOND_CHAN_NONE);
}

void connectToWiFi() 
{
  Serial.println("Connecting to Wi-Fi...");
  WiFi.begin(ssid);
  int attempts = 0;
  while(WiFi.status() != WL_CONNECTED && attempts < 20) 
  {  // Retry for 20 attempts
    delay(200);
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

void sendToFirebaseM(float averageDbStatus) 
{
  //Connect to Wi-Fi
  esp_wifi_set_promiscuous(false); // Disable promiscuous mode
  connectToWiFi();
  WiFiClientSecure client;
  client.setInsecure();  // Disable SSL cert validation for simplicity

  // Check if client can connect to Firebase
  if(!client.connect(host, 443)) 
  {
    Serial.println("Connection to Firebase failed");
    return;
  }

  String url = "/2b/Microphone.json?auth=" + String(firebaseSecret);
  String payload = String(averageDbStatus);

  // Send data to Firebase
  Serial.println("Sending data to Firebase...");
  client.print(String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + payload.length() + "\r\n\r\n" +
               payload);

  // Read response from Firebase
  String response = "";
  while(client.available()) 
  {
    response = client.readStringUntil('\n');
    Serial.println("Response from Firebase: ");
    Serial.println(response);  // This should give us more info on what Firebase is returning
  }

  /*
  // Debug: Print the URL and the payload to the Serial Monitor
  Serial.print("URL: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);
  */
  // Close the client connection after sending data
  client.stop();

  // Debug: Notify that the data was sent and the connection was closed
  Serial.println("Data sent and connection closed.");
  esp_wifi_set_promiscuous(true); // Enable promiscuous mode
  esp_wifi_set_promiscuous_rx_cb(&sniffer_callback);
  esp_wifi_set_channel(currentChannel, WIFI_SECOND_CHAN_NONE);
}

void sendToFirebaseW(int sniffingResult) 
{
  //Connect to Wi-Fi
  esp_wifi_set_promiscuous(false); // Disable promiscuous mode
  connectToWiFi();
  WiFiClientSecure client;
  client.setInsecure();  // Disable SSL cert validation for simplicity

  // Check if client can connect to Firebase
  if(!client.connect(host, 443)) 
  {
    Serial.println("Connection to Firebase failed");
    return;
  }

  String url = "/2b/WiFi_Sniffing.json?auth=" + String(firebaseSecret);
  String payload = String(sniffingResult);

  // Send data to Firebase
  Serial.println("Sending data to Firebase...");
  client.print(String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + payload.length() + "\r\n\r\n" +
               payload);

  // Read response from Firebase
  String response = "";
  while (client.available()) 
  {
    response = client.readStringUntil('\n');
    Serial.println("Response from Firebase: ");
    Serial.println(response);  // This should give us more info on what Firebase is returning
  }

  /*
  // Debug: Print the URL and the payload to the Serial Monitor
  Serial.print("URL: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);
  */
  // Close the client connection after sending data
  client.stop();

  // Debug: Notify that the data was sent and the connection was closed
  Serial.println("Data sent and connection closed.");
  esp_wifi_set_promiscuous(true); // Enable promiscuous mode
  esp_wifi_set_promiscuous_rx_cb(&sniffer_callback);
  esp_wifi_set_channel(currentChannel, WIFI_SECOND_CHAN_NONE);
}