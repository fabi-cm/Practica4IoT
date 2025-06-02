const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const IotData = new AWS.IotData({
    endpoint: 'a2nbbw2lfrp0hi-ats.iot.us-east-2.amazonaws.com',
    httpOptions: {
        timeout: 3000,
        connectTimeout: 2000
    }
});

// Configuración de parámetros para AWS IoT
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

// Función mejorada para obtener el shadow con manejo de errores
function getShadowPromise(params) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject('Timeout al obtener shadow');
        }, 3000);

        IotData.getThingShadow(params, (err, data) => {
            clearTimeout(timer);
            if (err) {
                console.error("Error detallado:", JSON.stringify(err, null, 2));
                reject(`Error al obtener shadow: ${err.code}`);
            } else {
                try {
                    resolve(JSON.parse(data.payload));
                } catch (parseErr) {
                    reject(`Error parseando shadow: ${parseErr.message}`);
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
            console.log("Consultando estado de la bomba...");
            const shadow = await getShadowPromise(ShadowParams);
            
            if (!shadow || !shadow.state || !shadow.state.reported) {
                throw new Error('No se pudieron obtener los datos del dispositivo');
            }
            
            const bombaState = shadow.state.reported.bomba || "desconocido";
            const estado = bombaState === "ON" ? 'encendida' : 'apagada';
            
            console.log(`Estado de la bomba: ${estado}`);
            
            return handlerInput.responseBuilder
                .speak(`La bomba de agua está ${estado}`)
                .withSimpleCard('Estado de la Bomba', `La bomba está ${estado}`)
                .withShouldEndSession(false)
                .reprompt('¿Necesitas otra información?')
                .getResponse();
                
        } catch (err) {
            console.error("Error en BombStateIntent:", err);
            return handlerInput.responseBuilder
                .speak('No pude verificar el estado de la bomba. Por favor, inténtalo más tarde.')
                .withShouldEndSession(false)
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
    handle(handlerInput, error) {
        console.log(`Error manejado: ${JSON.stringify(error)}`);
        
        return handlerInput.responseBuilder
            .speak('Disculpa, hubo un error. Por favor, inténtalo de nuevo.')
            .reprompt('¿Puedes repetir lo que necesitas?')
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
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('maceta-inteligente/v2.0')
    .lambda();