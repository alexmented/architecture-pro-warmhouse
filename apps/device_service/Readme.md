# Device Service

Микросервис для управления устройствами в системе умного дома.

## API Endpoints

### Создать модель устройства (админ)
```bash
curl -X POST http://localhost:8083/admin/device-models \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Чайник",
    "manufacturer": "Я",
    "model": "2000",
    "protocol": "HTTP"
  }'
```

### Подключить устройство пользователю
```bash
curl -X POST http://localhost:8083/devices \
  -H 'Content-Type: application/json' \
  -d '{
    "deviceId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Отправить команду устройству
```bash
curl -X POST http://localhost:8083/devices/123e4567-e89b-12d3-a456-426614174000/command \
  -H 'Content-Type: application/json' \
  -d '{
    "command": "set_temp",
    "params": {
      "value": 22
    }
  }'
```

### Получить список устройств
```bash
curl http://localhost:8083/devices
```