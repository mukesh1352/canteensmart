#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ThingSpeak.h>

const char *ssid = "Deepak";
const char *password = "qwerty123";

// Firebase settings
const char *firebaseHost = "smartcanteen-28b15-default-rtdb.asia-southeast1.firebasedatabase.app";
const char *firebaseAuth = "vDK0NaXbd8sPvv5IAErMlSQGZQaoLuI0tZmeoruW";

// ThingSpeak settings
const char *thingSpeakApiKey = "KCXAF67LAM23ZTIO";
unsigned long channelID = 2896085;

const int waterSensorPin = 34;

WiFiClientSecure secureClient;
WiFiClient tsClient;

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\n✅ Connected to WiFi");

  ThingSpeak.begin(tsClient);
}

void loop() {
  int sensorValue = analogRead(waterSensorPin);
  Serial.println("💧 Sensor Value: " + String(sensorValue));

  // Send to ThingSpeak
  ThingSpeak.setField(1, sensorValue);
  int x = ThingSpeak.writeFields(channelID, thingSpeakApiKey);

  if (x == 200) {
    Serial.println("📡 Data sent to ThingSpeak successfully!");
  } else {
    Serial.println("❌ ThingSpeak Error Code: " + String(x));
  }

  // Read value back from ThingSpeak
  float latestSensorValue = ThingSpeak.readFloatField(channelID, 1);

  // Firebase path and raw value payload
  String path = "/sensorData.json?auth=" + String(firebaseAuth);
  String payload = String(latestSensorValue);

  // Send to Firebase
  secureClient.setInsecure(); // Skip certificate check
  if (secureClient.connect(firebaseHost, 443)) {
    secureClient.print(String("POST ") + path + " HTTP/1.1\r\n" +
                       "Host: " + firebaseHost + "\r\n" +
                       "Content-Type: application/json\r\n" +
                       "Content-Length: " + String(payload.length()) + "\r\n\r\n" +
                       payload);

    Serial.println("📬 Sent to Firebase: " + payload);

    // Print response
    while (secureClient.connected()) {
      String line = secureClient.readStringUntil('\n');
      if (line == "\r") break;
      Serial.println(line);
    }

    Serial.println("✅ Firebase response complete");
    secureClient.stop();
  } else {
    Serial.println("❌ Connection to Firebase failed");
  }

  delay(15000); // wait before next read
}