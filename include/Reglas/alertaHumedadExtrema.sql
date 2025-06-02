SELECT 
  topic(3) AS thing_name,
  state.reported.humedad AS humedad,
  state.reported.modo AS modo
FROM '$aws/things/+/shadow/update'
WHERE 
  state.reported.humedad < 10 OR 
  state.reported.humedad > 95