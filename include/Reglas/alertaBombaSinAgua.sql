SELECT 
  topic(3) AS thing_name,
  state.reported.bomba AS bomba,
  state.reported.necesita_recarga AS necesita_recarga
FROM '$aws/things/+/shadow/update'
WHERE 
  state.reported.bomba = 'ON' AND 
  state.reported.necesita_recarga = true