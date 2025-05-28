#pragma once
#include <Arduino.h>

class SensorNivelAgua {
  public:
    SensorNivelAgua(int pinAnalogico, int pinDigital = -1, int umbralMinimo = 2000);
    bool necesitaRecarga();
    int leerNivel();
    bool estadoActual();
    
  private:
    int _pinAnalogico;
    int _pinDigital;
    int _umbralMinimo;
    bool _usarDigital;
};