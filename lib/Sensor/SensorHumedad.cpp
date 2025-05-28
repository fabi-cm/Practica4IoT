#include "SensorHumedad.h"

SensorHumedad::SensorHumedad(int pin) : _pin(pin) {
  pinMode(_pin, INPUT);
}

float SensorHumedad::leerHumedad() {
  int lectura = analogRead(_pin);
  lectura = constrain(lectura, _waterValue, _airValue);
  return map(lectura, _airValue, _waterValue, 0, 100);
}