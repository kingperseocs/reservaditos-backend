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

## El proyecto completo
Son tres repositorios. **Empieza por este**: la web y la app consumen esta API.

| # | Repositorio | Qué es | Quién lo usa |
|---|---|---|---|
| 1 | [reservaditos-backend](https://github.com/kingperseocs/reservaditos-backend) (este) | API NestJS + MongoDB, reglas de negocio, asistente IA | — |
| 2 | [reservaditos-webapp](https://github.com/kingperseocs/reservaditos-webapp) | Web Angular de la administración (aprobar, rechazar, suspender) | Administración |
| 3 | [reservaditos-mobileapp](https://github.com/kingperseocs/reservaditos-mobileapp) | App Flutter del residente (pedir, seguir el estado, pagar) | Residente |

```bash
git clone https://github.com/kingperseocs/reservaditos-backend.git
git clone https://github.com/kingperseocs/reservaditos-webapp.git
git clone https://github.com/kingperseocs/reservaditos-mobileapp.git
```

**Orden para ver el flujo de punta a punta en local:**
1. Backend: MongoDB + datos de demo + API en `http://localhost:8000` (abajo, [Cómo correrlo](#cómo-correrlo)).
2. Web: `pnpm install && pnpm start` → http://localhost:4200.
3. App: `flutter pub get && flutter run` en un emulador de Android.
4. En la app (residente Ana) pide la Parrilla → en la web aprueba la solicitud → la app pasa sola a «Aprobada» → paga → «Confirmada» con código.

**Sin instalar nada:** mientras la demo en AWS esté activa (hasta el 13/11/2026), la API responde en `http://15.229.3.0/v1` y su Swagger en http://15.229.3.0/docs. La web (`pnpm start:aws`) y la app (`config/aws.json`) traen una configuración lista para usarla.

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
- Node **26 LTS** (`.nvmrc`; mínimo 24.9)
- pnpm 10 (si no lo tienes: `corepack enable`, viene con Node)
- Docker Desktop (para MongoDB local; o un MongoDB propio en el puerto 27017)

## Cómo correrlo
```bash
git clone https://github.com/kingperseocs/reservaditos-backend.git
cd reservaditos-backend
pnpm install
cp .env.example .env      # opcional: GEMINI_API_KEY (gratis en aistudio.google.com)
docker compose up -d      # MongoDB en localhost:27017
pnpm seed                 # datos de demo (Edificio Demo)
pnpm start:dev
```
- API: http://localhost:8000/v1
- Swagger: http://localhost:8000/docs
- Comprobar: http://localhost:8000/v1/health debe responder `"database": "up"`.

Sin `GEMINI_API_KEY` todo funciona igual salvo el asistente (`POST /v1/assistant/interpret` responde `503 AI_NOT_CONFIGURED`). La clave es gratuita y no pide tarjeta.

Si el puerto 27017 ya está en uso (por ejemplo, un servicio de MongoDB instalado en Windows), detén ese servicio o deja que la API use ese Mongo y salta `docker compose up -d`.

### Con Docker (imagen de producción)
```bash
docker build -t reservaditos-backend .
docker run -p 8000:8000 --network reservaditos-backend_default \
  -e MONGODB_URI=mongodb://mongo:27017/reservaditos \
  -e GEMINI_API_KEY=tu_clave reservaditos-backend
```
Imagen multi-stage con Node 26, solo dependencias de producción, usuario sin privilegios y `HEALTHCHECK` sobre `/v1/health`.

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
- **El asistente no tiene memoria de conversación:** cada mensaje se interpreta solo. Para un chat de varios turnos, la app reenviaría el `intent` anterior junto con el mensaje nuevo (sin estado en el servidor), o se guardaría la conversación en Mongo con un `conversationId` y TTL.

## Despliegue en AWS
Hay dos niveles: lo que **se desplegó de verdad** para la demo (un EC2, barato y por dos días) y cómo quedaría **en producción**.

### Desplegado: demo en EC2
| | |
|---|---|
| **URL** | `http://15.229.3.0/v1` · Swagger en http://15.229.3.0/docs *(activo del 11 al 13/11/2026; luego la instancia se elimina)* |
| **Infraestructura** | 1 instancia **EC2 t3.micro** (Ubuntu 24.04) en **São Paulo (sa-east-1)** con **Docker Compose**: la API (este `Dockerfile`) y MongoDB 7 en la red interna, sin puerto público |
| **Archivos** | [`docker-compose.prod.yml`](docker-compose.prod.yml) y [`.env.production.example`](.env.production.example) |
| **Costo** | Dentro de la capa gratuita (t3.micro); como mucho, centavos por la IP pública. Con alerta de presupuesto en AWS Budgets |

```bash
# En el servidor (Ubuntu con Docker instalado)
git clone https://github.com/kingperseocs/reservaditos-backend.git && cd reservaditos-backend
cp .env.production.example .env.production   # PUBLIC_BASE_URL y GEMINI_API_KEY
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec api node dist/database/seed.js
```
El grupo de seguridad abre a internet solo el puerto 80 (HTTP). El 22 (SSH) se abrió únicamente mientras se instalaba y se cierra después. MongoDB no tiene puerto público.

**Por qué EC2 para la demo.** Es el mismo `Dockerfile` y la misma forma de correrlo que en local, así que hay menos piezas nuevas que pueden fallar. El costo es acotado y conocido para dos días, y se borra al terminar. São Paulo es la región más cercana a Lima. Al ser un proceso continuo, el cron de vencimiento funciona igual que en desarrollo.

**Qué mejoraría para producción** (la arquitectura de abajo):

| Demo en EC2 | Producción |
|---|---|
| HTTP en una IP pública | HTTPS con dominio (certificado de ACM en el ALB o CloudFront) |
| MongoDB en el mismo servidor; los datos viven en su disco | MongoDB Atlas con réplicas y backups automáticos |
| `GEMINI_API_KEY` en un `.env` del servidor | AWS Secrets Manager |
| Una sola instancia; si se cae, se cae el servicio | ECS Fargate con 2 o más tareas y health checks del ALB |
| Despliegue manual (`git pull` + `docker compose`) | GitHub Actions → ECR → ECS con rol IAM por OIDC |
| Logs con `docker logs` | CloudWatch Logs y alarmas |
| SSH abierto a una IP | Sin SSH (SSM Session Manager) y la API en subred privada |

### Producción
```
                 GitHub Actions (push a main: tests → build → deploy, rol OIDC sin claves fijas)
                        │ imagen Docker
                        ▼
 App Flutter ─┐     Amazon ECR
              │         │
 Web Angular ─┼──▶ Application Load Balancer (HTTPS · ACM) ──▶ ECS Fargate (NestJS, /v1/health)
 (S3 +        │                                                    │        │
  CloudFront) │                                     Secrets Manager┘        └──▶ MongoDB Atlas (us-east-1)
              │                                     MONGODB_URI, GEMINI_API_KEY   CloudWatch Logs
```

| Pieza | Servicio | Por qué |
|---|---|---|
| API | **ECS Fargate** detrás de un **Application Load Balancer** | Contenedores sin administrar servidores. El ALB da HTTPS (certificado de ACM) y usa `/v1/health` como health check. Es un proceso continuo, así que el cron de vencimiento funciona igual que en local. |
| Imagen | **Amazon ECR** | Registro privado de la imagen Docker de este repo. |
| Base de datos | **MongoDB Atlas** en la misma región de AWS | MongoDB administrado, con réplicas y backups. Mismo código: solo cambia `MONGODB_URI`. El acceso se restringe a la IP de salida del NAT Gateway, o con PrivateLink en clusters dedicados. |
| Secretos | **AWS Secrets Manager** | `MONGODB_URI` y `GEMINI_API_KEY` llegan como variables de entorno del task; nunca están en el repo ni en la imagen. |
| Logs | **CloudWatch Logs** | Driver `awslogs` del task de ECS. |
| Web de la administración | **S3 + CloudFront** | El build de Angular es estático. |
| CI/CD | **GitHub Actions** con rol IAM por **OIDC** | Después de los tests: `docker build`, push a ECR y actualización del servicio de ECS. Sin access keys guardadas en GitHub. |

Pasos, en resumen:
1. Crear el cluster en MongoDB Atlas (región `us-east-1`), un usuario de base de datos y la regla de acceso de red.
2. Guardar `MONGODB_URI` y `GEMINI_API_KEY` en Secrets Manager.
3. Crear el repositorio en ECR y subir la imagen (`docker build`, `docker push`).
4. Crear el cluster de ECS, la task definition (puerto 8000, secretos, logs) y el servicio Fargate con un ALB apuntando a `/v1/health`.
5. Cargar los datos de demo una vez, ejecutando el mismo task con el comando `node dist/database/seed`.
6. Agregar al workflow un job de deploy que asuma un rol IAM por OIDC y actualice el servicio en cada push a `main`.

Escalar a varias instancias es seguro: el vencimiento de reservas es idempotente y el índice único de Mongo protege el cupo, aunque dos instancias procesen lo mismo a la vez.

## Cómo usé IA mientras programaba
Usé **Claude Code** (Anthropic) como asistente de desarrollo en la terminal, trabajando por pasos y con revisión mía antes de avanzar:

- **Reglas para la IA en el repo.** Antes de escribir código definí [CLAUDE/rules.md](CLAUDE/rules.md): rol, objetivo, las 6 reglas de negocio, arquitectura (Clean Architecture + DDD), convenciones (código en inglés, pnpm) y criterio de terminado. El asistente lo lee en cada sesión, así el código sale consistente.
- **Análisis y supuestos.** Con la IA revisé las reglas ambiguas (cuándo corre el plazo de 24 h, qué significa «gana el primero», cómo contar el día de gracia) y dejé cada decisión escrita en este README.
- **Generación de código y tests.** El asistente propuso y escribió el dominio, los casos de uso, los adaptadores de Mongo y de IA, y los tests; yo validé cada paso antes del siguiente. Cada regla tiene tests unitarios y el flujo completo tiene tests e2e.
- **Depuración.** El primer pipeline de GitHub se colgó en los e2e. Con la IA reproduje el CI en un contenedor Linux sin `.env` y encontramos la causa: la app validaba las variables al cargarse, antes de que el test levantara Mongo. Se corrigió con un setup global de Jest (commit `fix(test): …`).
- **Elección del modelo.** Consulté los modelos disponibles para mi clave de Gemini, descarté uno retirado para cuentas nuevas y elegí uno rápido del plan gratuito, con respaldo ante el 503/429 del free tier.
- **Verificación manual.** Probé todos los endpoints en Postman siguiendo el flujo (residente → administración → pago → suspensión) y el asistente con mensajes reales a Gemini.

Lo que no delegué: las decisiones de producto y de stack, la revisión del código y las pruebas finales.

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
