SELECT 
  topic(3) AS thing_name,
  state.reported.nivel_agua AS nivel_agua,
  state.reported.necesita_recarga AS necesita_recarga,
  state.reported.modo AS modo
FROM '$aws/things/+/shadow/update'
WHERE 
  state.reported.necesita_recarga = true AND
  state.reported.modo = 'AUTOMATICO'