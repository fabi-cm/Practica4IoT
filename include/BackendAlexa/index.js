const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const IotData = new AWS.IotData({
    endpoint: 'a2nbbw2lfrp0hi-ats.iot.us-east-2.amazonaws.com',
    httpOptions: {
        timeout: 3000,
        connectTimeout: 2000
    }
});
const sns = new AWS.SNS();

async function enviarEstadoPorCorreo(mensaje) {
    const params = {
        Subject: 'Estado de tu maceta inteligente',
        Message: mensaje,
        TopicArn: 'arn:aws:sns:us-east-2:077076922622:alertasMacetaSmart'
    };

    try {
        await sns.publish(params).promise();
        console.log("Correo enviado con éxito.");
    } catch (error) {
        console.error("Error enviando el correo:", error);
    }
}

const TurnOffParams = {
    thingName: 'prueba1',
    payload: JSON.stringify({
        state: { 
            desired: { 
                bomba: "OFF"
            } 
        }
    })
};

const TurnOnParams = {
    thingName: 'prueba1',
    payload: JSON.stringify({
        state: { 
            desired: { 
                bomba: "ON"
            } 
        }
    })
};

const ShadowParams = {
    thingName: 'prueba1',
};

function getShadowPromise(params) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('Timeout al obtener shadow'));
        }, 5000); // Aumenta el timeout a 5 segundos

        IotData.getThingShadow(params, (err, data) => {
            clearTimeout(timer);
            if (err) {
                console.error("Error detallado:", {
                    code: err.code,
                    message: err.message,
                    stack: err.stack
                });
                reject(new Error(`Error al obtener shadow: ${err.code}`));
            } else {
                try {
                    const parsed = JSON.parse(data.payload);
                    console.log("Shadow obtenido:", JSON.stringify(parsed, null, 2));
                    resolve(parsed);
                } catch (parseErr) {
                    reject(new Error(`Error parseando shadow: ${parseErr.message}`));
                }
            }
        });
    });
}

// Handlers principales
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Bienvenido a tu maceta inteligente. Puedes preguntar por el estado de la bomba o la humedad cuando quieras. ¿Qué deseas hacer ahora?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt('¿Quieres consultar el estado de la bomba o la humedad?')
            .withShouldEndSession(false)
            .getResponse();
    }
};

const TurnOnIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOnBombIntent';
    },
    async handle(handlerInput) {
        try {
            await IotData.updateThingShadow(TurnOnParams).promise();
            return handlerInput.responseBuilder
                .speak('Encendiendo la bomba de agua')
                .withShouldEndSession(false)
                .reprompt('¿Necesitas algo más?')
                .getResponse();
        } catch (err) {
            console.error("Error al encender:", err);
            return handlerInput.responseBuilder
                .speak('Hubo un error al encender la bomba')
                .withShouldEndSession(false)
                .getResponse();
        }
    }
};

const TurnOffIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TurnOffBombIntent';
    },
    async handle(handlerInput) {
        try {
            await IotData.updateThingShadow(TurnOffParams).promise();
            return handlerInput.responseBuilder
                .speak('Apagando la bomba de agua')
                .withShouldEndSession(false)
                .reprompt('¿Quieres que haga algo más?')
                .getResponse();
        } catch (err) {
            console.error("Error al apagar:", err);
            return handlerInput.responseBuilder
                .speak('Hubo un error al apagar la bomba')
                .withShouldEndSession(false)
                .getResponse();
        }
    }
};

const StateIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FlowerPotStateIntent';
    },
    async handle(handlerInput) {
        try {
            console.log("Consultando estado del dispositivo...");
            const shadow = await getShadowPromise(ShadowParams);
            
            if (!shadow || !shadow.state || !shadow.state.reported) {
                throw new Error('Datos del dispositivo incompletos');
            }
            
            const bombaState = shadow.state.reported.bomba || "desconocido";
            const humedad = shadow.state.reported.humedad !== undefined ? 
                           shadow.state.reported.humedad : "indeterminada";
            
            console.log(`Estado obtenido: bomba=${bombaState}, humedad=${humedad}`);
            
            return handlerInput.responseBuilder
                .speak(`La bomba está ${bombaState === "ON" ? 'encendida' : 'apagada'} y la humedad es del ${humedad}%`)
                .withSimpleCard('Estado de la Maceta', `Bomba: ${bombaState}, Humedad: ${humedad}%`)
                .withShouldEndSession(false)
                .reprompt('¿Quieres consultar algo más?')
                .getResponse();
        } catch (err) {
            console.error("Error en StateIntent:", err);
            return handlerInput.responseBuilder
                .speak('No pude consultar el estado del dispositivo. Por favor, inténtalo de nuevo.')
                .withShouldEndSession(false)
                .getResponse();
        }
    }
};
const BombStateIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'BombStateIntent';
    },
    async handle(handlerInput) {
    try {
        console.log("Iniciando consulta de estado de bomba...");
        const shadow = await getShadowPromise(ShadowParams);
        console.log("Shadow recibido:", JSON.stringify(shadow, null, 2));
        
        if (!shadow || !shadow.state) {
            console.error("Shadow incompleto - falta state");
            throw new Error('No se pudieron obtener los datos del dispositivo');
        }
        
        if (!shadow.state.reported) {
            console.error("Shadow incompleto - falta reported");
            throw new Error('El dispositivo no ha reportado su estado');
        }
        
        const bombaState = shadow.state.reported.bomba;
        if (bombaState === undefined) {
            console.error("Estado de bomba no definido en shadow");
            throw new Error('Estado de bomba no disponible');
        }
        
        const estado = bombaState === "ON" ? 'encendida' : 'apagada';
        console.log(`Estado final de bomba: ${estado}`);
        
        return handlerInput.responseBuilder
            .speak(`La bomba de agua está ${estado}`)
            .getResponse();
    } catch (err) {
        console.error("Error completo en BombStateIntent:", {
            message: err.message,
            stack: err.stack
        });
        return handlerInput.responseBuilder
            .speak('No pude verificar el estado de la bomba. Por favor, inténtalo más tarde.')
            .getResponse();
    }
}
};

// Handlers estándar de Alexa
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Puedes pedirme: "Estado de la bomba", "¿Cómo está la humedad?", "Enciende la bomba" o "Apaga la bomba". ¿Qué necesitas?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Hasta pronto! Gracias por usar tu maceta inteligente.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Lo siento, no entendí eso. Puedes pedirme que encienda o apague la bomba, o que consulte el estado. ¿Qué deseas hacer?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const SetModoAutomaticoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetModoAutomaticoIntent';
    },
    async handle(handlerInput) {
        const payload = {
            state: {
                desired: {
                    modo: "AUTOMATICO"
                }
            }
        };

        try {
            await IotData.updateThingShadow({
                thingName: 'prueba1',
                payload: JSON.stringify(payload)
            }).promise();

            return handlerInput.responseBuilder
                .speak('Modo automático activado. La maceta se encargará solita de regar.')
                .getResponse();
        } catch (err) {
            console.error("Error al cambiar a modo automático:", err);
            return handlerInput.responseBuilder
                .speak('No se pudo cambiar a modo automático. Intenta de nuevo más tarde.')
                .getResponse();
        }
    }
};

const SetModoManualIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SetModoManualIntent';
    },
    async handle(handlerInput) {
        const payload = {
            state: {
                desired: {
                    modo: "MANUAL"
                }
            }
        };

        try {
            await IotData.updateThingShadow({
                thingName: 'prueba1',
                payload: JSON.stringify(payload)
            }).promise();

            return handlerInput.responseBuilder
                .speak('Modo manual activado. Ahora tú tienes el control.')
                .getResponse();
        } catch (err) {
            console.error("Error al cambiar a modo manual:", err);
            return handlerInput.responseBuilder
                .speak('No se pudo cambiar a modo manual. Intenta de nuevo más tarde.')
                .getResponse();
        }
    }
};

const EnviarCorreoEstadoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EnviarCorreoEstadoIntent';
    },
    async handle(handlerInput) {
        try {
            console.log("Consultando estado del dispositivo...");
            const shadow = await getShadowPromise(ShadowParams);
            
            if (!shadow || !shadow.state || !shadow.state.reported) {
                throw new Error('Datos del dispositivo incompletos');
            }
            
            const reported = shadow.state.reported;
            const bombaState = reported.bomba || "desconocido";
            const humedad = reported.humedad !== undefined ? reported.humedad : "indeterminada";
            const nivelAgua = reported.nivel_agua !== undefined ? reported.nivel_agua : "indeterminado";
            const necesitaRecarga = reported.necesita_recarga || false;
            
            // Mensaje mejorado con alerta de agua
            let mensaje = `Estado de la maceta inteligente:\n
- Bomba: ${bombaState}\n
- Humedad: ${humedad}%\n
- Nivel de agua: ${nivelAgua}%`;

            if (necesitaRecarga) {
                mensaje += "\n\n🚨 ALERTA: El tanque de agua necesita recarga urgente!";
            } else if (nivelAgua < 30) {
                mensaje += "\n\n⚠ Advertencia: El nivel de agua está bajo, considera recargar pronto.";
            }

            console.log(`Enviando mensaje: ${mensaje}`);
            await enviarEstadoPorCorreo(mensaje);

            // Respuesta vocal adaptada
            let speakOutput = "He enviado el estado actual de tu maceta a tu correo.";
            if (necesitaRecarga) {
                speakOutput += " ¡ATENCIÓN! El tanque necesita recarga de agua urgente.";
            }

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .withSimpleCard('Estado enviado por correo', mensaje)
                .getResponse();
        } catch (err) {
            console.error("Error en EnviarCorreoEstadoIntent:", err);
            return handlerInput.responseBuilder
                .speak("No pude enviar el correo. " + (err.message || "Verifica la configuración de SNS."))
                .getResponse();
        }
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Sesión finalizada: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    async handle(handlerInput, error) {
        console.error(`Error completo: ${error.stack}`);
        
        // Enviar notificación de error
        await sns.publish({
            TopicArn: 'arn:aws:sns:us-east-2:077076922622:alertasMacetaSmart',
            Subject: 'ERROR en Skill de Alexa',
            Message: `Error: ${error.message}\nStack: ${error.stack}`
        }).promise();

        return handlerInput.responseBuilder
            .speak('Lo siento, hubo un problema técnico. He enviado una alerta al administrador. Por favor, inténtalo de nuevo más tarde.')
            .withShouldEndSession(false)
            .getResponse();
    }
};

// Configuración final del handler
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        TurnOnIntentHandler,
        TurnOffIntentHandler,
        StateIntentHandler,
        BombStateIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SetModoAutomaticoIntentHandler,
        SetModoManualIntentHandler,
        EnviarCorreoEstadoIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('maceta-inteligente/v2.0')
    .lambda();