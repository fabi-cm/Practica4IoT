
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

// Configuración de la tabla DynamoDB
const TABLE_NAME = 'smartFlowerPot_dataDB';

exports.handler = async (event) => {
    try {
        console.log('Evento recibido:', JSON.stringify(event, null, 2));
        
        // 1. Extraer datos del evento (ya viene parseado por IoT Core)
        const {
            thing_name = 'unknown_device',
            bomba = 'UNKNOWN',
            humedad,
            modo = 'AUTOMATICO',
            nivel_agua,
            necesita_recarga = false,
            device_type = 'unknown',
            serial_number = '0000'
        } = event;

        // 2. Validación de campos requeridos
        if (humedad === undefined || nivel_agua === undefined) {
            throw new Error('Campos requeridos faltantes: humedad o nivel_agua');
        }

        // 3. Preparar ítem para DynamoDB
        const dbItem = {
            thing_name: thing_name,
            device_id: `${device_type}_${serial_number}`, // Campo compuesto
            timestamp: Date.now(),
            bomba: bomba,
            humedad: Number(humedad), // Asegura tipo numérico
            modo: modo,
            nivel_agua: Number(nivel_agua),
            necesita_recarga: Boolean(necesita_recarga),
            device_type: device_type,
            serial_number: serial_number,
            expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 
        };
        const params = {
            TableName: TABLE_NAME,
            Item: dbItem
        };
        console.log('Datos preparados para guardar:', dbItem);
        await ddb.put(params).promise();

        console.log('Datos guardados exitosamente:', dbItem);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Datos registrados correctamente',
                data: dbItem
            })
        };

    } catch (error) {
        console.error('Error en la ejecución:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Error al procesar los datos',
                error: error.message,
                inputEvent: event 
            })
        };
    }
};