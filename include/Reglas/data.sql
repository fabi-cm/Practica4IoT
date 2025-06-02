SELECT 
    topic(3) AS thing_name,
    timestamp() AS timestamp,
    substring(topic(3), 0, 14) AS device_type,
    substring(topic(3), 15) AS serial_number,
    state.reported.bomba AS bomba,
    state.reported.humedad AS humedad,
    state.reported.modo AS modo,
    state.reported.nivel_agua AS nivel_agua,
    state.reported.necesita_recarga AS necesita_recarga
FROM 
    '$aws/things/+/shadow/update'
WHERE 
    (state.reported.bomba = 'ON' OR state.reported.bomba = 'OFF')
    AND state.reported.humedad <> NULL
    AND (state.reported.modo = 'MANUAL' OR state.reported.modo = 'AUTOMATICO')
    AND state.reported.nivel_agua <> NULL
    AND state.reported.necesita_recarga <> NULL