#include "SensorNivelAgua.h"

SensorNivelAgua::SensorNivelAgua(int pinAnalogico, int pinDigital, int umbralMinimo)
  : _pinAnalogico(pinAnalogico), _pinDigital(pinDigital), _umbralMinimo(umbralMinimo) {
  pinMode(_pinAnalogico, INPUT_PULLUP);
  _usarDigital = (_pinDigital != -1);
  if(_usarDigital) {
    pinMode(_pinDigital, INPUT_PULLUP);
  }
}

bool SensorNivelAgua::necesitaRecarga() {
  int lectura = analogRead(_pinAnalogico);
  return lectura < 1000;
}

int SensorNivelAgua::leerNivel() {
  return analogRead(_pinAnalogico);
}

bool SensorNivelAgua::estadoActual() {
  int lectura = analogRead(_pinAnalogico);
  return lectura > 3000;
}