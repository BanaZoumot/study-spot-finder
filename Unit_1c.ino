#include <SparkFun_VL53L5CX_Library.h>  // VL53L5CX LiDAR sensor library
#include <WiFi.h>  // Wi-Fi library to connect the ESP32 to a network[]
#include <WiFiClientSecure.h>  // Secure Wi-Fi client for connecting to Firebase (TLS Protocol over HTTPS)
#include <Wire.h>  // Wire library for I2C communication
#include <Arduino.h>  // Base Arduino functionality
#include <driver/i2s.h>  // I2S driver for audio input
#include <arduinoFFT.h>  // FFT library for audio signal processing
#include <math.h>  // Math functions for audio signal analysis

// Wi-Fi credentials
const char* ssid = "CanesGuest";  // Your Wi-Fi SSID

// Firebase settings
const char* host = "seniordesignsensordata.firebaseio.com";  // Firebase host URL (without https://)
const char* firebaseSecret = "xbD67oeeBbinWyCux8NwhJNBJmQAyZZZjCrjJfrx";  // Firebase secret for authentication

// VL53L5CX sensor settings for LiDAR
#define imageWidth 8  // Set the image width and height for the LiDAR grid (4x4)
int16_t threshold = 800;  // Distance threshold in millimeters for detecting objects
int16_t cell_array[imageWidth][imageWidth];  // Array to store LiDAR distance data

// INMP441 microphone settings for sound detection
#define SAMPLES 1024  // Number of samples for audio analysis (FFT size)
#define SAMPLING_FREQUENCY 44100  // Audio sampling rate in Hz
#define MIN_SPEECH_FREQ 100  // Minimum frequency to consider as speech
#define MAX_SPEECH_FREQ 5000  // Maximum frequency to consider as speech

// Pin assignments for the I2S microphone
#define I2S_WS 25
#define I2S_SD 33
#define I2S_SCK 32
#define I2S_PORT I2S_NUM_0  // I2S interface used

// Signal thresholds and smoothing parameters for sound analysis
#define RMS_THRESHOLD 100.0  // RMS threshold for detecting loud sounds
#define SPECTRAL_FLATNESS_THRESHOLD 0.4  // Spectral flatness threshold for speech detection
#define SMOOTHING_FACTOR 0.1  // Smoothing factor for RMS calculation
#define AVG_SPAN 30000  // Average time span (30 seconds) for calculating dB average

int16_t sBuffer[SAMPLES];  // Buffer to hold raw audio samples
float vReal[SAMPLES];  // Real part of the FFT
float vImag[SAMPLES];  // Imaginary part of the FFT

ArduinoFFT<float> FFT = ArduinoFFT<float>(vReal, vImag, SAMPLES, SAMPLING_FREQUENCY, false);  // FFT object for audio analysis

// LiDAR sensor setup
SparkFun_VL53L5CX sensorRL;  // LiDAR sensor object
VL53L5CX_ResultsData measurementData;  // Data structure to hold the measurement results

// Variables for motion detection
bool allUnderThreshold = true;  // Flag to check if all detected distances are under the threshold
int motion = 0;  // Variable to track motion direction (1 = forward, -1 = backward, 0 = no motion)
float smoothedRms = 0;  // Smoothed RMS value for audio analysis
float dbSum = 0;  // Sum of dB values for averaging
int dbCount = 0;  // Counter for the number of dB values
unsigned long startTime = 0;  // Start time for averaging dB values

// Function to calculate RMS (Root Mean Square) for the audio signal
float calculateRMS(float* signal, int startIndex, int endIndex) 
{
  double sum = 0.0;
  int count = 0;
  int startBin = (int)((float)startIndex * SAMPLES / SAMPLING_FREQUENCY);  // Convert frequency range to FFT bins
  int endBin = (int)((float)endIndex * SAMPLES / SAMPLING_FREQUENCY);

  // Loop through the signal within the frequency range and calculate RMS
  for(int i = startBin; i < endBin && i < SAMPLES / 2; i++) 
  {
    sum += signal[i] * signal[i];
    count++;
  }

  if(count == 0) return 0.0;  // Prevent division by zero
  return sqrt(sum / count);  // Return the RMS value
}

// Function to calculate Spectral Flatness (used to detect speech)
float calculateSpectralFlatness(float* signal, int startIndex, int endIndex) 
{
  double geometricMean = 1.0;
  double arithmeticMean = 0.0;
  int count = 0;
  float epsilon = 1e-9;  // Small constant to avoid division by zero

  int startBin = (int)((float)startIndex * SAMPLES / SAMPLING_FREQUENCY);  // Convert frequency range to FFT bins
  int endBin = (int)((float)endIndex * SAMPLES / SAMPLING_FREQUENCY);

  // Calculate geometric and arithmetic means for the frequency bins
  for(int i = startBin; i < endBin && i < SAMPLES / 2; i++) 
  {
    if(signal[i] > 0.0) 
    {
      geometricMean *= signal[i];
      arithmeticMean += signal[i];
      count++;
    }
  }

  if(count == 0) return 0.0;  // Prevent division by zero

  geometricMean = pow(geometricMean, 1.0 / count);  // Geometric mean calculation
  arithmeticMean /= count;  // Arithmetic mean calculation

  if(arithmeticMean < epsilon) 
  {
    return 0.0;
  }

  return geometricMean / arithmeticMean;  // Return the spectral flatness
}

// I2S setup functions for the microphone
void i2s_install() 
{
  const i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),  // Set I2S mode to receive data
    .sample_rate = SAMPLING_FREQUENCY,  // Set sample rate to 44.1kHz
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,  // Set 16-bit sample depth
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,  // Mono channel input
    .communication_format = I2S_COMM_FORMAT_I2S,  // I2S protocol
    .intr_alloc_flags = 0,
    .dma_buf_count = 8,  // DMA buffer count
    .dma_buf_len = SAMPLES,  // Number of samples per DMA buffer
    .use_apll = false
  };

  esp_err_t err = i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);  // Install the I2S driver
  if(err != ESP_OK) { Serial.println(esp_err_to_name(err)); }   // If installation fails, print the error
}

void i2s_setpin() 
{
  const i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,  // Set the clock pin for I2S
    .ws_io_num = I2S_WS,  // Set the word select pin for I2S
    .data_out_num = -1,  // No data output pin (only input)
    .data_in_num = I2S_SD  // Set the data input pin for I2S
  };

  esp_err_t err = i2s_set_pin(I2S_PORT, &pin_config);  // Configure the I2S pins
  if(err != ESP_OK) { Serial.println(esp_err_to_name(err)); }   // If pin configuration fails, print the error
}

void setup() 
{
  Serial.begin(115200);  // Start serial communication at 115200 baud rate

  // Connect to Wi-Fi
  connectToWiFi();

  // Initialize the VL53L5CX LiDAR sensor
  Wire.begin(21, 22);  // I2C bus initialization
  Wire.setClock(400000);  // Set I2C clock speed to 400kHz
  if(!sensorRL.begin()) 
  {
    Serial.println("VL53L5CX failed to initialize.");  // Check if sensor initialization fails
    while (1);  // Halt if sensor fails
  }

  // Set LiDAR sensor parameters
  sensorRL.setResolution(imageWidth * imageWidth);  // Set resolution (grid size)
  sensorRL.setRangingFrequency(15);  // Set frequency for range measurements
  sensorRL.startRanging();  // Start the LiDAR ranging process

  // Initialize I2S for microphone audio input
  i2s_install();
  i2s_setpin();
  i2s_start(I2S_PORT);
}

void loop() 
{
  // LiDAR portion: Detect motion based on LiDAR distance data
  if(sensorRL.isDataReady()) 
  {
    if(sensorRL.getRangingData(&measurementData)) 
    {
      // Process LiDAR data and check if any values exceed the threshold
      for(int y = 0; y < imageWidth; ++y) 
      {
        for(int x = 0; x < imageWidth; ++x) 
        {
          cell_array[x][y] = measurementData.distance_mm[y * imageWidth + x];
          if (cell_array[x][y] > threshold) 
          {
            allUnderThreshold = false;  // If any distance exceeds threshold, there's continuous motion (nothing is blocking the sensor)
          }
        }
      }

      // Detect motion direction based on specific cells' values
      if(!allUnderThreshold) 
      {
        int row1 = (imageWidth / 2) - 1;
        int row2 = imageWidth / 2;

        if (cell_array[row1][imageWidth - 1] < threshold ||  // Check cells for forward motion
            cell_array[row1][imageWidth - 2] < threshold ||
            cell_array[row2][imageWidth - 1] < threshold ||
            cell_array[row2][imageWidth - 2] < threshold) { motion = 1; }   // Motion detected towards the right (forward) 
        else if (cell_array[row1][0] < threshold ||  // Check cells for backward motion
                   cell_array[row1][1] < threshold ||
                   cell_array[row2][0] < threshold ||
                   cell_array[row2][1] < threshold) { motion = -1; }    // Motion detected towards the left (backward)
      }

      // If motion is detected, send the motion data to Firebase
      if(motion != 0) 
      {
        sendToFirebaseL(motion);
        motion = 0;  // Reset motion state
        delay(1500);  // Add delay to avoid sending multiple requests in quick succession
      }
    }
  }

  // Microphone portion: Capture and analyze audio data
  size_t bytesRead = 0;
  esp_err_t result = i2s_read(I2S_PORT, sBuffer, sizeof(sBuffer), &bytesRead, portMAX_DELAY);

  if(result == ESP_OK && bytesRead > 0) 
  {
    // Convert the audio samples into the FFT input format
    for(int i = 0; i < SAMPLES; i++) 
    {
      vReal[i] = (float)sBuffer[i];
      vImag[i] = 0;
    }

    // Perform FFT analysis on the audio data
    FFT.windowing(vReal, SAMPLES, FFT_WIN_TYP_HAMMING, FFT_FORWARD);
    FFT.compute(vReal, vImag, SAMPLES, FFT_FORWARD);
    FFT.complexToMagnitude(vReal, vImag, SAMPLES);

    // Calculate RMS and spectral flatness for speech detection
    float rms = calculateRMS(vReal, MIN_SPEECH_FREQ, MAX_SPEECH_FREQ);
    float spectralFlatness = calculateSpectralFlatness(vReal, MIN_SPEECH_FREQ, MAX_SPEECH_FREQ);

    // Smooth the RMS value over time
    smoothedRms = (SMOOTHING_FACTOR * rms) + ((1.0 - SMOOTHING_FACTOR) * smoothedRms);
    float db = 20 * log10(smoothedRms + 1);  // Convert RMS to dB

    // If the sound is loud enough and has speech-like characteristics, send the average dB to Firebase
    if(smoothedRms > RMS_THRESHOLD && spectralFlatness < SPECTRAL_FLATNESS_THRESHOLD) 
    {
      dbSum += db;  // Accumulate dB values
      dbCount++;  // Increment the count of dB values

      if (startTime == 0) { startTime = millis(); }   // Start the timer for averaging

      // After the specified averaging time (30 seconds), calculate and send the average dB
      if(millis() - startTime >= AVG_SPAN) 
      {
        if(dbCount > 0) 
        {
          float averageDb = dbSum / dbCount;
          Serial.println(averageDb);
          sendToFirebaseM(averageDb);  // Send the average dB value to Firebase
        }
        dbSum = 0;  // Reset the sum and count
        dbCount = 0;
        startTime = millis();  // Restart the timer
      }
    }
  }
}

// Function to connect to Wi-Fi
void connectToWiFi() 
{
  WiFi.begin(ssid);  // Start the Wi-Fi connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20)
  {
    delay(150);
    Serial.print(".");
    attempts++;
  }
  if(WiFi.status() == WL_CONNECTED) { Serial.println("\nConnected to Wi-Fi."); }
}

// Function to send motion data to Firebase
void sendToFirebaseL(int motionStatus) 
{
  WiFiClientSecure client;
  client.setInsecure();  // Disable SSL cert validation for simplicity
  // Check if client can connect to Firebase
  if(!client.connect(host, 443)) 
  {
    Serial.println("Connection to Firebase failed.");  // Print an error message if connection fails
    return;
  }

  // Build the Firebase URL and payload for the motion data
  String url = "/1c/LiDAR.json?auth=" + String(firebaseSecret);
  String payload = String(motionStatus);

  // Send data to Firebase
  client.print(String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + payload.length() + "\r\n\r\n" +
               payload);

  
  // Debugging Statements
  Serial.print("URL: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);
  

  // Optionally read the response
  while(client.connected()) 
  {
    String line = client.readStringUntil('\n');
    if(line == "\r") break;
  }
  
  // Close the client connection after sending data
  client.stop();
}

// Function to send microphone data (average dB) to Firebase
void sendToFirebaseM(float averageDbStatus) 
{
  WiFiClientSecure client;
  client.setInsecure();  // Disable SSL cert validation for simplicity
  // Check if client can connect to Firebase
  if(!client.connect(host, 443)) 
  {
    Serial.println("Connection to Firebase failed.");  // Print an error message if connection fails
    return;
  }

  // Build the Firebase URL and payload for the average dB data
  String url = "/1c/Microphone.json?auth=" + String(firebaseSecret);
  String payload = String(averageDbStatus);

  // Send data to Firebase
  client.print(String("PUT ") + url + " HTTP/1.1\r\n" +
               "Host: " + host + "\r\n" +
               "Content-Type: application/json\r\n" +
               "Content-Length: " + payload.length() + "\r\n\r\n" +
               payload);

  
  // Debugging Statements
  Serial.print("URL: ");
  Serial.println(url);
  Serial.print("Payload: ");
  Serial.println(payload);
  

  // Optionally read the response
  while(client.connected()) 
  {
    String line = client.readStringUntil('\n');
    if (line == "\r") break;
  }
  
  // Close the client connection after sending data
  client.stop();
}
