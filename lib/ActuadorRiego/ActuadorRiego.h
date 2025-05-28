#pragma once
#include <Arduino.h>

class ActuadorRiego {
  public:
    ActuadorRiego(int pin);
    void comenzarRiego();
    void detenerRiego();
  private:
    int _pin;
};