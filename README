# 🌱 README - Sistema de Maceta Inteligente con Alexa

## 📌 Descripción del Proyecto
Sistema IoT completo para automatizar el cuidado de plantas con:
- Monitoreo en tiempo real de humedad del suelo y nivel de agua
- Control por voz mediante Alexa
- Notificaciones proactivas cuando la planta necesita atención

## 🛠 Componentes Clave

### Hardware (ESP32)
```c++
// Configuración básica en main.cpp
#define PIN_SENSOR 39    // Sensor humedad
#define PIN_RELE 4       // Bomba de agua
#define PIN_SENSOR_NIVEL 36 // Sensor nivel agua
```

### AWS Services
- **IoT Core**: Comunicación MQTT con el dispositivo
- **Lambda**: 
  - `BackendAlexa` (Skill de Alexa)
  - `LambdaDynamo` (Procesamiento de datos)
- **DynamoDB**: Almacenamiento de estados históricos
- **SNS**: Alertas por correo electrónico

## 🔄 Flujo Principal

1. **Dispositivo ESP32**:
   - Publica datos cada 5 segundos via MQTT
   - Implementa lógica de riego automático
   ```c++
   if (modo == "AUTOMATICO" && humedad < 30 && !necesitaAgua) {
     bomba.comenzarRiego();
   }
   ```

2. **Backend Alexa**:
   - 15+ comandos de voz implementados
   - Consulta y control del estado en tiempo real
   ```javascript
   // Ejemplo: Consultar estado
   const shadow = await getShadowPromise(ShadowParams);
   const humedad = shadow.state.reported.humedad;
   ```

3. **Alertas Automáticas**:
   - Notifica cuando el nivel de agua es bajo
   ```sql
   -- Regla IoT Core
   SELECT thing_name, nivel_agua 
   FROM '$aws/things/+/shadow/update'
   WHERE necesita_recarga = true
   ```

## 💡 Características Destacadas

- **Dual modo de operación**: Automático/Manual
- **Protección integrada**: Detiene el riego si no hay agua
- **Histórico de datos**: Almacenamiento en DynamoDB
- **Interacción natural**: Soporte para múltiples frases en Alexa

## 🚀 Configuración Rápida

1. **ESP32**:
   ```bash
   # platformio.ini
   [env:esp32dev]
   platform = espressif32
   board = esp32dev
   lib_deps = 
     PubSubClient
     ArduinoJson
   ```

2. **AWS**:
   ```bash
   aws dynamodb create-table --table-name smartFlowerPot_dataDB \
     --attribute-definitions AttributeName=thing_name,AttributeType=S \
     --key-schema AttributeName=thing_name,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

## 📊 Comandos de Alexa Ejemplo
- *"Alexa, pregunta a maceta inteligente por la humedad"*
- *"Alexa, dile a maceta inteligente que active el modo automático"*
- *"Alexa, pide a maceta inteligente que envíe un reporte por correo"*

## 🛡️ Seguridad
- Conexión MQTT segura con certificados X.509
- Validación de datos en todas las capas
- Alertas por errores críticos

> **Nota**: Reemplazar `TU_SSID`, `TU_PASSWORD` y certificados AWS en `config.h`