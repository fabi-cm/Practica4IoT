SELECT topic(3) AS thing_name,
    substring(topic(3), 0, 14) AS device_type,
    substring(topic(3), 15) AS serial_number,
    state.reported.bomba AS bomba_status
FROM '$aws/things/+/shadow/update'
WHERE
substring(topic(3), 0, 14)='smartFlowerPot' AND
state.reported.bomba = "ON"