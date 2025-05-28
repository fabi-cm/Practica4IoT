#include "ActuadorRiego.h"

ActuadorRiego::ActuadorRiego(int pin) : _pin(pin) {
  pinMode(_pin, OUTPUT);
  digitalWrite(_pin, LOW);
}

void ActuadorRiego::comenzarRiego() {
  digitalWrite(_pin, HIGH);
}

void ActuadorRiego::detenerRiego() {
  digitalWrite(_pin, LOW);
}