# BluePixel - MVP de gestion de solicitudes B2B

Plataforma B2B multi-tenant para registrar y administrar solicitudes internas. Cada organización funciona como un tenant independiente y ningún usuario puede acceder a información de otra organización.

## Stack

| Capa           | Tecnología                                |
| -------------- | ----------------------------------------- |
| Framework      | Next.js `16.3.4` (App Router)             |
| UI             | React `19.2.8`, Tailwind CSS 4, Shadcn/ui |
| Autenticación  | NextAuth `4.24.15` (Credentials + JWT)    |
| Validación     | Zod `4.5.4`                               |
| Estado cliente | TanStack React Query `5.102.8` + Axios    |
| ORM            | Prisma `7.10.0`                           |
| Base de datos  | PostgreSQL 15                             |
| Tests          | Vitest `3.2.4`                            |
| Contenedores   | Docker + Docker Compose                   |

## Requisitos previos

- Node.js 20 o superior
- npm 10 o superior
- Docker y Docker Compose

## Puesta en marcha

### 1. Clonar e instalar

```bash
git clone https://github.com/PinchePach1/bluePixel-MVP.git
cd bluePixel-MVP
npm install
```

### 2. Configurar el entorno

En macOS/Linux:

```bash
cp .env.example .env
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Contenido esperado:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bluepixel"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cambia-esto-por-un-secreto-largo-y-aleatorio"
```

Genera un secreto en macOS/Linux con `openssl rand -base64 32`. En PowerShell puedes usar:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. Levantar PostgreSQL

```bash
docker compose up -d
docker compose ps
```

PostgreSQL 15 queda disponible en `localhost:5433` y usa el puerto interno `5432`.

### 4. Aplicar migraciones y seed

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

El seed crea:

- Organización: `Blue Pixel`
- Admin: `admin@bluepixel.com` / `admin123`
- Member: `member@bluepixel.com` / `member123`

Estas credenciales son solo para evaluación local.

### 5. Ejecutar la aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La raíz redirige a `/login`.

## Comandos disponibles

| Comando                                  | Descripción                               |
| ---------------------------------------- | ----------------------------------------- |
| `npm run dev`                            | Servidor de desarrollo                    |
| `npm run build`                          | Build de producción                       |
| `npm run start`                          | Servidor de producción después de `build` |
| `npm run lint`                           | Ejecuta ESLint                            |
| `npm test`                               | Ejecuta Vitest una vez                    |
| `npm run test:watch`                     | Vitest en modo watch                      |
| `npx tsc --noEmit`                       | Verificación de tipos                     |
| `npx prisma studio`                      | Inspecciona la base de datos              |
| `npx prisma migrate dev --name <nombre>` | Crea una migración de desarrollo          |
| `npx prisma migrate reset`               | Borra y reinicia la base local            |
| `npx prisma db seed`                     | Ejecuta el seed                           |

> `npx prisma migrate reset` es destructivo y elimina los datos de la base seleccionada. Úsalo solo en desarrollo.

## Flujo funcional

Como `ADMIN` (`admin@bluepixel.com` / `admin123`):

1. Inicia sesión en `/login`.
2. Consulta el dashboard y el listado de solicitudes.
3. Crea una solicitud, edítala mientras esté en `DRAFT` y envíala.
4. Aprueba o rechaza solicitudes en estado `SUBMITTED`.
5. Comprueba el historial de transiciones.

Como `MEMBER` (`member@bluepixel.com` / `member123`):

1. Puede crear y enviar sus solicitudes.
2. No puede aprobar ni rechazar solicitudes.
3. La API debe responder `403` si intenta aprobar una solicitud.

Ejemplo con una cookie de sesión válida:

```bash
curl -X PATCH http://localhost:3000/api/requests/<id> \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie-de-sesion>" \
  -d '{"status":"APPROVED"}'
# {"error":"No tienes permisos para aprobar/rechazar solicitudes"}
```

Las solicitudes de otro tenant responden `404` para no revelar que el recurso existe.

## Tests

```bash
npm test
```

- `lib/request-policies.test.ts`: aislamiento multi-tenant, permisos por rol y transiciones.
- `lib/validations.test.ts`: esquemas Zod de creación y actualización.

Las políticas están implementadas como funciones puras en `lib/request-policies.ts`, sin dependencias de Prisma ni NextAuth.

## API y OpenAPI

| Método   | Ruta                 | Función                                  |
| -------- | -------------------- | ---------------------------------------- |
| `GET`    | `/api/requests`      | Lista solicitudes del tenant autenticado |
| `POST`   | `/api/requests`      | Crea una solicitud en `DRAFT`            |
| `GET`    | `/api/requests/{id}` | Obtiene detalle e historial              |
| `PATCH`  | `/api/requests/{id}` | Edita o cambia el estado                 |
| `DELETE` | `/api/requests/{id}` | Elimina una solicitud; solo `ADMIN`      |

El contrato está en [`docs/openapi.yaml`](./docs/openapi.yaml). Para visualizarlo:

```bash
npx @redocly/cli preview-docs docs/openapi.yaml
```

Después abre normalmente `http://localhost:8080`.

## Estructura principal

```text
app/api/requests/route.ts              # GET, POST
app/api/requests/[id]/route.ts         # GET, PATCH, DELETE
app/dashboard/                         # Dashboard y vistas de solicitudes
components/                            # Componentes React y UI
hooks/useRequests.ts                   # React Query y Axios
lib/auth.ts                            # Configuración NextAuth
lib/prisma.ts                          # Cliente Prisma
lib/request-policies.ts                # Reglas de negocio
lib/validations.ts                     # Esquemas Zod
prisma/schema.prisma                   # Modelo de datos
prisma/seed.ts                         # Datos iniciales
docs/openapi.yaml                      # Contrato OpenAPI
proxy.ts                               # Protección de rutas
docker-compose.yml                     # PostgreSQL local
```

## Decisiones y documentación

Las decisiones de arquitectura, trade-offs, deuda técnica, evolución con notificaciones externas, observabilidad, seguridad y CI/CD están documentadas en [`ARCHITECTURE.md`](./ARCHITECTURE.md).

El uso de herramientas de inteligencia artificial durante el desarrollo está documentado en [`AI_USAGE.md`](./AI_USAGE.md).

Decisiones principales:

- Monolito Next.js con Route Handlers.
- JWT stateless con claims de rol y tenant.
- Políticas de autorización en funciones puras.
- Aislamiento multi-tenant mediante filtros `tenantId` en las consultas.

## Modelo de datos

- `Organization`: representa un tenant.
- `User`: pertenece a una organización y tiene rol `ADMIN` o `MEMBER`.
- `Request`: solicitud con estado `DRAFT`, `SUBMITTED`, `APPROVED` o `REJECTED`.
- `RequestHistory`: registra cada cambio de estado con autor, timestamp y comentario opcional.

Transiciones válidas:

```text
DRAFT -> SUBMITTED
SUBMITTED -> APPROVED
SUBMITTED -> REJECTED
```

Las transiciones se validan en `request-policies.ts`, no solo en el frontend.

## Solución de problemas

Si PostgreSQL no arranca:

```bash
docker compose down -v
docker compose up -d
```

> `docker compose down -v` elimina el volumen y los datos locales.

Si el schema cambió y la migración no se aplicó:

```bash
npx prisma migrate dev --name <descripcion>
npx prisma generate
```

Si el login devuelve `401`, verifica los usuarios con `npx prisma studio` y vuelve a ejecutar `npx prisma db seed` si es necesario.

## Licencia

Proyecto privado para evaluación técnica. No distribuir.
