# Sensor Data Collection, Wi-Fi Sniffing, and Firebase Integration

This project combines motion detection, distance measurement, sound measurement, and Wi-Fi sniffing using an ESP32 microcontroller. It integrates multiple sensors for environmental data collection, sends sensor data to Firebase in real-time, and performs Wi-Fi sniffing to track unique MAC addresses in the surrounding area. The data is stored in Firebase for monitoring, and Wi-Fi sniffing results are printed to the Serial Monitor.

## Features

- **Motion Detection**: Uses the VL53L5CX LiDAR sensor to detect motion in a 4x4 grid and sends motion data to Firebase when detected. Also uses the Adafruit VL53L1X distance sensor to measure the proximity of objects and sends this data to Firebase.
- **Sound Measurement**: Uses the INMP441 microphone to measure sound levels, specifically detecting speech frequency ranges (100Hz to 5000Hz), and sends decibel (dB) data to Firebase.
- **Wi-Fi Sniffing**: Tracks nearby Wi-Fi devices by sniffing MAC addresses, counting valid devices, hopping Wi-Fi channels, and calculating the average number of unique MAC addresses over a 30-second window. Tthe program must routinely switch promiscuous mode on and off when it performs sniffing and when it needs to send the average MAC addresses to firebase, respectively.
- **Firebase Integration**: Sends both motion, distance, and sound data to Firebase in real-time for further analysis or monitoring.
- **Wi-Fi Connectivity**: Connects to a Wi-Fi network to enable internet communication with Firebase.
- **FFT Processing**: Applies Fast Fourier Transform (FFT) to microphone data to process sound signals.

## Components Used

- **ESP32-WROOM-32E Microcontroller**: The main board for controlling the sensors, handling network communication, and performing Wi-Fi sniffing.
- **Pololu VL53L5CX LiDAR Sensor**: A 4x4 grid LiDAR sensor used for motion detection.
- **Adafruit VL53L1X Distance Sensor**: A distance sensor used to measure the proximity of objects.
- **INMP441 Microphone**: A microphone for capturing sound signals.
- **Firebase**: A real-time database used to store sensor data.

## Libraries Used

- `SparkFun_VL53L5CX_Library`: For interfacing with the VL53L5CX sensor.
- `Adafruit_VL53L1X`: For interfacing with the Adafruit VL53L1X distance sensor.
- `WiFi.h`: For Wi-Fi connectivity.
- `WiFiClientSecure.h`: For secure communication with Firebase.
- `Wire.h`: For I2C communication.
- `driver/i2s.h`: For configuring and reading from the INMP441 microphone.
- `arduinoFFT.h`: For performing Fast Fourier Transform (FFT) on microphone data.
- `math.h`: For mathematical operations (e.g., square root, logarithms).
- `esp_wifi.h`: For Wi-Fi sniffing functionality on ESP32.

## Setup and Configuration

1. **Install Required Libraries**: Make sure you have installed the necessary libraries from the Arduino Library Manager.
   - `SparkFun VL53L5CX Library`
   - `Adafruit VL53L1X Library`
   - `WiFi Library`
   - `WiFiClientSecure Library`
   - `arduinoFFT Library`

2. **Configure Wi-Fi and Firebase**:
   - Modify the `ssid` and `password` variables to match your Wi-Fi credentials.
   - Set up Firebase with your Firebase project and use the database URL and authentication token (firebase secret). Replace `host` and `firebaseSecret` variables with your credentials.

3. **Connect Sensors**:
   - Connect the **VL53L5CX** and **Adafruit VL53L1X** distance sensors to your ESP32 using I2C (pins 21 and 22).
   - Connect the **INMP441** microphone to the I2S interface (define the proper I2S pins in the code).

4. **Upload Code**:
   - Upload the provided code to your ESP32 using the Arduino IDE.

5. **Monitor Data**:
   - Use the Serial Monitor to view data or debug information.
   - Firebase will store motion, distance, and sound data in the specified paths.

6. **Wi-Fi Sniffing**:
   - The ESP32 will track unique Wi-Fi devices (MAC addresses) in its vicinity by sniffing Wi-Fi packets.
   - Periodically hop between Wi-Fi channels to detect more devices and calculate the average number of unique MAC addresses seen over a 30-second window.

## Code Overview

### Key Variables:

- **Wi-Fi Credentials**: `ssid` and `password` for connecting the ESP32 to your Wi-Fi network.
- **Firebase Credentials**: `host` and `firebaseSecret` for connecting to Firebase.
- **Sensor Settings**:
  - `imageWidth`: Defines the grid size for the VL53L5CX LiDAR sensor.
  - `SAMPLES`, `SAMPLING_FREQUENCY`: Defines microphone sampling rate and data length.
  - `RMS_THRESHOLD`, `SPECTRAL_FLATNESS_THRESHOLD`: Defines thresholds for speech detection.
  - `THRESHOLD`: Distance threshold for the Adafruit VL53L1X sensor (below which the motion is detected).

### Main Functions:

- **`setup()`**: Initializes the sensors, Wi-Fi, and I2S interface, and sets up Wi-Fi sniffing.
- **`loop()`**: Continuously reads data from the LiDAR, distance sensor, and microphone, processes it, and sends it to Firebase. Also, handles the Wi-Fi sniffing and channel hopping logic.
  - LiDAR data is processed to detect motion and send status to Firebase.
  - Adafruit VL53L1X distance sensor checks the proximity of objects and sends status data to Firebase when an object is detected within the threshold distance.
  - Microphone data is processed with FFT, and sound levels are sent to Firebase.
  - Wi-Fi sniffing is done by tracking MAC addresses, calculating the average number of devices seen in the last 30 seconds, and hopping between channels to detect more devices.

### Helper Functions:

- **`calculateRMS()`**: Computes the Root Mean Square (RMS) value of the microphone data.
- **`calculateSpectralFlatness()`**: Calculates the spectral flatness of the audio signal to help distinguish speech from other sounds.
- **`sendToFirebaseL()`**: Sends motion data to Firebase.
- **`sendToFirebaseM()`**: Sends microphone data (average dB) to Firebase.
- **`sendToFirebase()`**: Sends distance sensor data to Firebase when an object is detected.
- **`sniffer_callback()`**: Callback function that processes sniffed Wi-Fi packets, extracting MAC addresses and RSSI.
- **`cleanExpiredMACs()`**: Removes expired MAC addresses from the map based on inactivity.
- **`hopToNextChannel()`**: Changes the current Wi-Fi channel to enable sniffing on different channels.
- **`connectToWiFi()`**: Connects to Wi-Fi, retrying up to 20 attempts if the connection fails.

## Firebase Structure

Data is stored in Firebase under the following paths:

- `/Unit_Name/LiDAR.json`: Stores the status data from the Adafruit VL53L1X distance sensor.
- `/Unit_Name/Microphone.json`: Stores the average dB value from the microphone.
- `/Unit_Name/Wifi_Sniffing.json`: Stores the status data from the Adafruit VL53L1X distance sensor.

## Troubleshooting

- **No Wi-Fi Connection**: If the ESP32 cannot connect to Wi-Fi, ensure the credentials are correct and the network is in range.
- **Sensor Initialization Failed**: If the VL53L5CX or VL53L1X sensor doesn't initialize, check the wiring and ensure the sensors are functioning properly.
- **Firebase Connection Issues**: Ensure the `host` and `firebaseSecret` are correct and that the ESP32 can reach the internet.
- **Wi-Fi Sniffing**: If no MAC addresses are being detected, ensure the ESP32 is in promiscuous mode and is not blocked by any firewall or network restrictions.
