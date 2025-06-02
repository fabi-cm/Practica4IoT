#pragma once

const char* WIFI_SSID = "TU_SSID";
const char* WIFI_PASS = "TU_PASSWORD";

const char* MQTT_BROKER = "tu-endpoint.iot.region.amazonaws.com";
const int MQTT_PORT = 8883;
const char* CLIENT_ID = "ESP32_Riego_Plantas";

const char AWS_ROOT_CA[] = R"EOF(...)EOF";
const char DEVICE_CERT[] = R"EOF(...)EOF";
const char PRIVATE_KEY[] = R"EOF(...)EOF";

const char* SHADOW_UPDATE = "$aws/things/prueba1/shadow/update";
const char* SHADOW_DELTA = "$aws/things/prueba1/shadow/update/delta";