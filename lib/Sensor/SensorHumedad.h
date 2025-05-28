#pragma once
#include <Arduino.h>

class SensorHumedad {
  public:
    SensorHumedad(int pin);
    float leerHumedad();
  private:
    int _pin;
    const int _airValue = 4095;
    const int _waterValue = 1800;
};