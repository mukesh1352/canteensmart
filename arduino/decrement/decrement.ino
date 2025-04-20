
#include <WiFi.h>
#include "Adafruit_MQTT.h"
#include "Adafruit_MQTT_Client.h"
#include <FirebaseESP32.h>

// Wi-Fi Credentials
const char* ssid = "Vikas";
const char* password = "12345678";

// Adafruit IO credentials
#define AIO_SERVER      "io.adafruit.com"
#define AIO_SERVERPORT  1883
#define AIO_USERNAME    "Albert_1884"
#define AIO_KEY         "aio_yTSN76mL7zTqUtNB4jAjiEoKOvQv"

// Firebase credentials
#define FIREBASE_HOST "https://smartcanteen-28b15-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_TOKEN "vDK0NaXbd8sPvv5IAErMlSQGZQaoLuI0tZmeoruW"

// Firebase setup
FirebaseData firebaseData;
FirebaseAuth firebaseAuthObj;
FirebaseConfig firebaseConfig;

// MQTT setup
WiFiClient client;
Adafruit_MQTT_Client mqtt(&client, AIO_SERVER, AIO_SERVERPORT, AIO_USERNAME, AIO_KEY);
Adafruit_MQTT_Publish counterFeedPublish = Adafruit_MQTT_Publish(&mqtt, AIO_USERNAME "/feeds/counter");

// Ultrasonic sensor pins
#define TRIG_PIN 14
#define ECHO_PIN 27

int counter = 0;
bool objectDetected = false;
unsigned long lastDetectionTime = 0;
const unsigned long detectionInterval = 500;  // reduced to 0.5 seconds

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected!");
}

void MQTT_connect() {
  int8_t ret;
  if (mqtt.connected()) return;

  Serial.print("Connecting to MQTT... ");
  while ((ret = mqtt.connect()) != 0) {
    Serial.println(mqtt.connectErrorString(ret));
    mqtt.disconnect();
    delay(2000);  // shorter retry interval
  }
  Serial.println("✅ MQTT Connected!");
}

void connectFirebase() {
  firebaseConfig.database_url = FIREBASE_HOST;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_TOKEN;
  Firebase.begin(&firebaseConfig, &firebaseAuthObj);
  Firebase.reconnectWiFi(true);
}

float readDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 5000); // reduced timeout for quicker reads
  return (duration > 0) ? (duration * 0.0343) / 2 : -1;
}

void publishCounter() {
  if (!counterFeedPublish.publish((int32_t)counter)) {
    Serial.println("❌ Failed to publish to Adafruit IO");
  } else {
    Serial.println("✅ Published to Adafruit IO");
  }
}

void sendCounterToFirebase() {
  if (Firebase.setInt(firebaseData, "/counter", counter)) {
    // No longer display the retrieved value from Firebase
  } else {
    Serial.print("❌ Firebase Error: ");
    Serial.println(firebaseData.errorReason());
  }
}

void getCounterFromFirebase() {
  if (Firebase.getInt(firebaseData, "/counter")) {
    counter = firebaseData.intData();  // Get the integer value from Firebase
  } else {
    Serial.print("❌ Error retrieving counter from Firebase: ");
    Serial.println(firebaseData.errorReason());
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  connectWiFi();
  connectFirebase();
  MQTT_connect();
}

void loop() {
  MQTT_connect();
  
  getCounterFromFirebase();  // Always retrieve the latest counter value from Firebase
  
  float distance = readDistance();
  unsigned long currentTime = millis();

  if (distance > 0 && distance < 100) {
    if (!objectDetected && currentTime - lastDetectionTime > detectionInterval) {
      objectDetected = true;
      lastDetectionTime = currentTime;
      // Decrement the counter but ensure it doesn't go below 0
      if (counter > 0) {
        counter--;  // decrement counter
        Serial.print("🚶Counter Decremented: ");
        Serial.println(counter);
        publishCounter();
        sendCounterToFirebase();
      }
    }
  } else {
    objectDetected = false;
  }

  mqtt.processPackets(10);
  mqtt.ping();
}


