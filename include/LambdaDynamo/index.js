const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'smartFlowerPot_dataDB';

exports.handler = async (event) => {
    try {
        console.log('Evento recibido:', JSON.stringify(event, null, 2));

        // Extracción más robusta del nombre del dispositivo
        const thingNameFromTopic = event.topic ? event.topic.split("/")[1] : "unknown_device";
        
        // Validación más estricta del estado reportado
        const reported = event.state?.reported || {};
        if (!reported || Object.keys(reported).length === 0) {
            throw new Error('No hay datos reportados en el evento');
        }

        // Valores por defecto mejorados
        const {
            bomba = 'OFF',
            humedad = null,
            modo = 'MANUAL',
            nivel_agua = null,
            necesita_recarga = false
        } = reported;

        // Validación de campos requeridos
        if (humedad === null || nivel_agua === null) {
            throw new Error('Datos incompletos: humedad y nivel_agua son requeridos');
        }

        // Estructura del ítem mejorada
        const dbItem = {
            thing_name: thingNameFromTopic,
            timestamp: Date.now(),
            bomba: bomba,
            humedad: parseFloat(humedad),
            modo: modo,
            nivel_agua: parseFloat(nivel_agua),
            necesita_recarga: Boolean(necesita_recarga),
            expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 días
        };

        // Parámetros de DynamoDB con mejor manejo de errores
        const params = {
            TableName: TABLE_NAME,
            Item: dbItem,
            ConditionExpression: 'attribute_not_exists(thing_name) OR attribute_not_exists(timestamp)'
        };

        console.log('Intentando guardar en DynamoDB:', JSON.stringify(dbItem, null, 2));
        await ddb.put(params).promise();
        console.log('✅ Datos guardados exitosamente.');

        // Verificar si necesita recarga y enviar alerta
        if (necesita_recarga) {
            const sns = new AWS.SNS();
            await sns.publish({
                TopicArn: 'arn:aws:sns:us-east-2:077076922622:alertasMacetaSmart',
                Subject: 'ALERTA: Tanque de agua bajo',
                Message: `El dispositivo ${thingNameFromTopic} necesita recarga de agua. Nivel actual: ${nivel_agua}%`
            }).promise();
            console.log('Alerta de recarga enviada');
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Datos registrados correctamente',
                data: dbItem
            })
        };

    } catch (error) {
        console.error('❌ Error en la ejecución:', error);
        
        // Enviar alerta de error
        const sns = new AWS.SNS();
        await sns.publish({
            TopicArn: 'arn:aws:sns:us-east-2:077076922622:alertasMacetaSmart',
            Subject: 'ERROR en registro de datos',
            Message: `Error al procesar datos: ${error.message}\nDatos recibidos: ${JSON.stringify(event, null, 2)}`
        }).promise();

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error al procesar los datos',
                error: error.message
            })
        };
    }
};