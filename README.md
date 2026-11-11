<p align="center">
  <a href="https://nestjs.com" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="96" alt="NestJS logo" />
  </a>
</p>

<h1 align="center">Reservaditos — Backend</h1>

<p align="center">
  <a href="https://github.com/kingperseocs/reservaditos-backend/actions/workflows/ci.yml"><img src="https://github.com/kingperseocs/reservaditos-backend/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white" alt="NestJS 12" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Node.js-26_LTS-5FA04E?logo=nodedotjs&logoColor=white" alt="Node.js 26 LTS" />
  <img src="https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white" alt="MongoDB 7" />
  <img src="https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white" alt="pnpm 10" />
  <img src="https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?logo=swagger&logoColor=black" alt="Swagger" />
  <img src="https://img.shields.io/badge/Jest-tests-C21325?logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/Gemini-AI-8E75B2?logo=googlegemini&logoColor=white" alt="Gemini" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT" /></a>
</p>

API para reservar áreas comunes de un edificio (parrilla, salón de usos múltiples, piscina). El residente pide un área para una fecha y un horario desde la app; la administración aprueba o rechaza desde la web; el residente paga con un link (pago simulado). Si no paga a tiempo, la reserva vence y el horario se libera.

## Stack
| | Tecnología | Uso |
|---|---|---|
| <img src="https://cdn.simpleicons.org/nestjs/E0234E" width="20" alt="" /> | NestJS 12 + TypeScript | API REST versionada (`/v1`), Clean Architecture + DDD |
| <img src="https://cdn.simpleicons.org/mongodb/47A248" width="20" alt="" /> | MongoDB 7 + Mongoose | Persistencia; Docker en local, Atlas en la nube |
| <img src="https://cdn.simpleicons.org/swagger/85EA2D" width="20" alt="" /> | Swagger (OpenAPI) | Documentación interactiva en `/docs` |
| <img src="https://cdn.simpleicons.org/jest/C21325" width="20" alt="" /> | Jest + Supertest | Tests unitarios por regla y e2e con MongoDB en memoria |
| <img src="https://cdn.simpleicons.org/googlegemini/8E75B2" width="20" alt="" /> | Google Gemini | Asistente que interpreta mensajes en texto libre (proveedor intercambiable) |
| <img src="https://cdn.simpleicons.org/githubactions/2088FF" width="20" alt="" /> | GitHub Actions | Lint, tests y build en cada push |

## Requisitos
- Node **26 LTS** (mínimo 24.9)
- pnpm 10
- Docker Desktop (para MongoDB local)

## Cómo correrlo
```bash
pnpm install
cp .env.example .env      # agrega GEMINI_API_KEY (gratis en aistudio.google.com)
docker compose up -d      # MongoDB en localhost:27017
pnpm seed                 # datos de demo (Edificio Demo)
pnpm start:dev
```
- API: http://localhost:8000/v1
- Swagger: http://localhost:8000/docs

### Usuarios de demo (header `x-user-id`)
| Id | Rol | Para qué sirve |
|---|---|---|
| `ana-perez` | Residente, depto 502, al día | Flujo principal: pedir, ver estado, pagar |
| `rosa-medina` | Residente, depto 403, cuota vencida | Pantalla «Aún no puedes reservar» |
| `admin` | Administración | Aprobar, rechazar, suspender áreas |

El seed usa fechas relativas a hoy: el **próximo sábado** la Parrilla tiene 15:00–18:00 ocupado, y hay 5 solicitudes pendientes (Jorge y Pedro piden el mismo horario; Jorge pidió primero).

## Tests
```bash
pnpm test        # unitarios: una suite por regla de negocio
pnpm test:e2e    # e2e con MongoDB en memoria, no necesita Docker
```
El workflow `.github/workflows/ci.yml` corre lint, tests unitarios, e2e y build en cada push.

## Decisiones y supuestos
- **Identidad simulada con `x-user-id`.** La prueba no pide login. El guard busca el usuario y su rol (`RESIDENT`/`ADMIN`); cambiarlo por JWT no toca controladores ni casos de uso.
- **Horarios fijos por área:** 12:00–15:00, 15:00–18:00 y 19:00–22:00. La piscina abre de viernes a domingo.
- **Plazo de pago (reglas 2 y 3):** `min(aprobación + 24 h, inicio del evento − 3 h)`. Así una reserva para dentro de 26 h también se paga 3 h antes. No se aprueba si ya no queda plazo, y no se pide un horario que empieza en menos de 3 h.
- **Vencimiento:** un cron cada minuto y, además, una verificación antes de cada lectura o escritura que dependa del cupo. El resultado no depende de que el cron haya corrido.
- **Gana el primero (regla 4):** varias solicitudes pueden esperar por el mismo horario, pero solo se aprueba la más antigua. Un índice único parcial en Mongo garantiza un solo dueño del cupo (`APPROVED`/`CONFIRMED`) aunque lleguen dos aprobaciones a la vez. Al pagar, las demás pendientes de ese horario se rechazan. Si la aprobada vence, la siguiente en la cola puede aprobarse.
- **Día de gracia (regla 5):** una cuota que vence el 05/11 deja reservar el 06/11 y bloquea desde el 07/11.
- **Suspensión (regla 6):** las reservas pagadas del rango pasan a `REFUNDED` con el 100 % (tarifa + garantía); las pendientes o aprobadas se rechazan con el motivo. No se puede suspender desde una fecha pasada.
- **Pago simulado:** al aprobar se genera un token; `POST /v1/payments/{token}` confirma y devuelve un código `DEMO-1234`. El token del link funciona como credencial, igual que un link de pago real.
- **Zona horaria:** `America/Lima` para las fechas de negocio; los instantes se guardan en UTC.
- **Asistente de IA con proveedor intercambiable:** el caso de uso depende de la interfaz `IntentExtractor`, no de un SDK. Gemini es el proveedor por defecto (plan gratuito, sin tarjeta); Claude está implementado y se activa con `AI_PROVIDER=anthropic`. Ambos usan el mismo JSON Schema: salida estructurada en Gemini y herramienta forzada en Claude.
- **La IA solo extrae; el dominio decide.** El modelo devuelve área, fecha y horario (o `null`). Validar que el área exista, que la fecha no haya pasado, que el horario sea de los ofrecidos y que esté libre lo hace el código, con tests. La respuesta del modelo se valida antes de usarla.
- **Resiliencia del plan gratuito:** Gemini a veces responde 503 (alta demanda) o 429 (cuota por minuto). Un 503 se reintenta una vez; cualquier otro fallo pasa al modelo de respaldo (`GEMINI_FALLBACK_MODEL`), que tiene su propia cuota. Si todo falla, la API responde `503 AI_UNAVAILABLE` y la app puede seguir con el calendario.
- **Sin transacciones Mongo:** la suspensión actualiza el área y luego las reservas una por una. Con un replica set (Atlas) se envolvería en una transacción.

## API
Base: `http://localhost:8000/v1`. Errores siempre con la forma:
```json
{ "statusCode": 409, "code": "SLOT_TAKEN", "message": "Ese horario ya está reservado." }
```

### Health
url: `/v1/health`
method: `GET`
header: —
body: —
Response `200`:
```json
{ "status": "ok", "database": "up", "timestamp": "2026-11-11T14:00:00.000Z" }
```

### Perfil del usuario actual
url: `/v1/residents/me`
method: `GET`
header: `x-user-id: ana-perez`
body: —
Response `200`:
```json
{ "id": "ana-perez", "name": "Ana Pérez", "role": "RESIDENT", "apartment": "502", "buildingName": "Edificio Demo" }
```

### ¿Está al día? (pantalla 4)
url: `/v1/residents/me/standing`
method: `GET`
header: `x-user-id: rosa-medina`
body: —
Response `200`:
```json
{ "upToDate": false, "overdueAmount": 350, "oldestOverdueDate": "2026-11-05", "graceDays": 1 }
```

### Áreas del edificio (pantalla 1)
url: `/v1/areas`
method: `GET`
header: `x-user-id: ana-perez`
body: —
Response `200`:
```json
[{ "id": "grill", "name": "Parrilla", "icon": "flame", "fee": 50, "deposit": 100, "total": 150, "availableToday": true }]
```

### Días con horarios del mes (calendario, pantalla 2)
url: `/v1/areas/{areaId}/availability?month=2026-11`
method: `GET`
header: `x-user-id: ana-perez`
body: —
Response `200`:
```json
{ "areaId": "grill", "month": "2026-11", "days": [{ "date": "2026-11-14", "available": true }] }
```

### Horarios de un día (pantalla 2)
url: `/v1/areas/{areaId}/slots?date=2026-11-14`
method: `GET`
header: `x-user-id: ana-perez`
body: —
Response `200` (`FREE` libre · `TAKEN` ocupado · `UNAVAILABLE` sin horario):
```json
{ "areaId": "grill", "date": "2026-11-14", "slots": [{ "start": "15:00", "end": "18:00", "label": "15:00–18:00", "status": "TAKEN" }] }
```

### Pedir reserva
url: `/v1/reservations`
method: `POST`
header: `x-user-id: ana-perez`
body:
```json
{ "areaId": "grill", "date": "2026-11-14", "startTime": "12:00", "endTime": "15:00" }
```
Response `201`: la reserva en `PENDING_APPROVAL` (misma forma que «Mi reserva»).
Errores: `403 RESIDENT_NOT_UP_TO_DATE` (con `details.overdueAmount` y `details.oldestOverdueDate`), `409 SLOT_TAKEN`, `409 DUPLICATE_REQUEST`, `409 AREA_UNAVAILABLE`, `409 TOO_LATE_TO_REQUEST`, `400 SLOT_NOT_OFFERED`.

### Mi reserva (pantalla 3)
url: `/v1/reservations/{id}` · lista: `/v1/reservations/me`
method: `GET`
header: `x-user-id: ana-perez`
body: —
Response `200`:
```json
{
  "id": "5b0c6d1e-…", "status": "APPROVED",
  "area": { "id": "grill", "name": "Parrilla", "icon": "flame" }, "buildingName": "Edificio Demo",
  "date": "2026-11-14", "slot": { "start": "12:00", "end": "15:00", "label": "12:00–15:00" },
  "fee": 50, "deposit": 100, "total": 150,
  "requestedAt": "2026-11-11T14:00:00.000Z", "paymentDeadline": "2026-11-12T14:00:00.000Z",
  "paymentUrl": "http://localhost:8000/v1/payments/9f2c…",
  "paidAt": null, "code": null, "rejectionReason": null, "refundAmount": null
}
```
Estados: `PENDING_APPROVAL` · `APPROVED` · `CONFIRMED` · `EXPIRED` · `REJECTED` · `REFUNDED`.

### Ver link de pago
url: `/v1/payments/{token}`
method: `GET`
header: —
body: —
Response `200`:
```json
{ "reservationId": "5b0c6d1e-…", "status": "APPROVED", "areaName": "Parrilla", "date": "2026-11-14", "slot": { "start": "12:00", "end": "15:00", "label": "12:00–15:00" }, "amount": 150, "deadline": "2026-11-12T14:00:00.000Z", "code": null }
```

### Pagar (simulado)
url: `/v1/payments/{token}`
method: `POST`
header: —
body: —
Response `200`: igual al anterior con `"status": "CONFIRMED"` y `"code": "DEMO-4821"`.
Errores: `409 PAYMENT_DEADLINE_PASSED`.

### Solicitudes por aprobar (web, pantalla 5)
url: `/v1/admin/reservations?status=PENDING_APPROVAL&areaId=grill&month=2026-11` (filtros opcionales)
method: `GET`
header: `x-user-id: admin`
body: —
Response `200`:
```json
[{
  "id": "seed-jorge", "status": "PENDING_APPROVAL",
  "resident": { "id": "jorge-diaz", "name": "Jorge Díaz", "apartment": "105" },
  "area": { "id": "grill", "name": "Parrilla", "icon": "flame" },
  "date": "2026-11-21", "slot": { "start": "15:00", "end": "18:00", "label": "15:00–18:00" },
  "requestedAt": "2026-11-11T11:00:00.000Z", "firstInLine": true
}]
```
`firstInLine` marca «Pedida primero» cuando varias solicitudes compiten por el mismo horario.

### Aprobar
url: `/v1/admin/reservations/{id}/approve`
method: `PATCH`
header: `x-user-id: admin`
body: —
Response `200`: la reserva en `APPROVED` con `paymentDeadline` y `paymentUrl`.
Errores: `409 NOT_FIRST_IN_LINE`, `409 SLOT_TAKEN`, `409 TOO_LATE_TO_APPROVE`.

### Rechazar
url: `/v1/admin/reservations/{id}/reject`
method: `PATCH`
header: `x-user-id: admin`
body:
```json
{ "reason": "El área está en mantenimiento ese día." }
```
Response `200`: la reserva en `REJECTED` con `rejectionReason`.

### Áreas (web)
url: `/v1/admin/areas`
method: `GET`
header: `x-user-id: admin`
body: —
Response `200`:
```json
[{ "id": "grill", "name": "Parrilla", "icon": "flame", "fee": 50, "deposit": 100, "status": "ACTIVE", "suspensions": [] }]
```

### Impacto de una suspensión (aviso del modal, pantalla 6)
url: `/v1/admin/areas/{areaId}/suspensions/preview?from=2026-11-20&to=2026-11-22`
method: `GET`
header: `x-user-id: admin`
body: —
Response `200`:
```json
{ "paidCount": 3, "refundAmount": 450, "unpaidCount": 1 }
```

### Suspender área (pantalla 6)
url: `/v1/admin/areas/{areaId}/suspensions`
method: `POST`
header: `x-user-id: admin`
body:
```json
{ "reason": "Mantenimiento programado", "from": "2026-11-20", "to": "2026-11-22" }
```
Response `201`:
```json
{ "paidCount": 3, "refundAmount": 450, "unpaidCount": 1, "suspension": { "id": "7c1f…", "from": "2026-11-20", "to": "2026-11-22", "reason": "Mantenimiento programado" } }
```

### Asistente: interpretar un mensaje (IA)
url: `/v1/assistant/interpret`
method: `POST`
header: `x-user-id: ana-perez`
body:
```json
{ "message": "quiero la parrilla el sábado de 7 a 10 pm" }
```
Response `200` cuando hay datos suficientes y el horario está libre:
```json
{
  "complete": true,
  "intent": { "areaId": "grill", "areaName": "Parrilla", "date": "2026-11-14", "startTime": "19:00", "endTime": "22:00" },
  "missing": null,
  "question": null,
  "reply": "Listo: Parrilla el sábado 14/11 de 19:00 a 22:00. Total S/ 150. ¿Confirmas la reserva?"
}
```
Response `200` cuando falta un dato (`missing`: `area` · `date` · `slot`):
```json
{
  "complete": false,
  "intent": { "areaId": "multipurpose-room", "areaName": "Salón de usos múltiples", "date": null, "startTime": null, "endTime": null },
  "missing": "date",
  "question": "¿Para qué día quieres el Salón de usos múltiples?",
  "reply": "¿Para qué día quieres el Salón de usos múltiples?"
}
```
Si el horario está ocupado, `question` propone los libres: «La Parrilla no está disponible el sábado 14/11 de 15:00–18:00. Quedan libres: 12:00–15:00, 19:00–22:00. ¿Te sirve alguno?».
Con `complete: true`, la app envía `intent` a `POST /v1/reservations`.
Errores: `503 AI_UNAVAILABLE`, `503 AI_NOT_CONFIGURED` (falta la clave).

> Reglas del proyecto para el desarrollo asistido: [CLAUDE/rules.md](CLAUDE/rules.md).

## Licencia
Distribuido bajo la licencia [MIT](LICENSE).
