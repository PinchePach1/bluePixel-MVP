# Uso de Inteligencia Artificial

Este documento declara las herramientas de IA utilizadas durante el desarrollo del MVP, para qué tareas se emplearon, qué partes fueron revisadas o modificadas manualmente y qué decisiones se tomaron sin asistencia.

El uso de IA está permitido por el enunciado de la prueba, con la condición explícita de documentarlo y revisar el resultado entregado. Este archivo cumple ese requisito.

---

## Herramientas utilizadas

| Herramienta                        | Rol                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **GitHub Copilot (Chat + Inline)** | Asistente principal para generación de código, refactor, resolución de errores y revisión de arquitectura. |
| **GPT 5.6 Luna**                   | Apoyo puntual en el diseño del `ARCHITECTURE.md`, revisión de trade-offs y redacción del `README.md`.      |

No se utilizaron generadores de código de extremo a extremo ni herramientas que produjeran artefactos sin revisión. Todo el código y la documentación fueron leídos y ajustados antes de integrarse.

---

## Tareas asistidas por IA

### Generación de código base

- **Configuración inicial** de Next.js, Prisma, NextAuth, Tailwind y Shadcn/ui.
- **Modelo de datos** en `prisma/schema.prisma`: entidades `Organization`, `User`, `Request` y `RequestHistory`, con el campo `tenantId` en cada tabla relevante.
- **Configuración de NextAuth** en `lib/auth.ts`, incluyendo los callbacks de JWT y sesión con claims personalizados (`id`, `role`, `tenantId`, `organizationName`).
- **Esquemas de validación** en `lib/validations.ts` con Zod.
- **Componentes de UI** (`LoginForm`, `NewRequestForm`, `RequestDetail`, layout protegido).
- **Handlers de API** en `app/api/requests/route.ts` y `app/api/requests/[id]/route.ts`.
- **Hooks de React Query** en `hooks/useRequests.ts`.

### Refactor y separación de responsabilidades

- **Extracción de reglas de negocio** a `lib/request-policies.ts` como funciones puras (`canAccessRequest`, `authorizeRequestUpdate`), en lugar de condicionales anidados dentro del handler `PATCH`. Esta refactorización fue sugerida por la IA y validada manualmente contra el comportamiento esperado del dominio.
- **Configuración de Vitest** y creación de tests unitarios en `lib/request-policies.test.ts` y `lib/validations.test.ts`.

### Documentación

- **Borrador de `ARCHITECTURE.md`** asistido por IA, incluyendo diagramas Mermaid, ADRs con alternativas y trade-offs, deuda técnica, evolución del requerimiento con notificaciones externas y propuesta de observabilidad, seguridad y CI/CD.
- **Borrador de `README.md`** con instrucciones reproducibles, usuarios de prueba, comandos y solución de problemas.
- **Redacción de este `AI_USAGE.md`**.

### Depuración de errores

- **Diagnóstico de errores de Prisma** (por ejemplo, `ColumnNotFound` por migración no aplicada), con instrucciones para ejecutar la migración correctiva y regenerar el cliente.
- **Corrección de tipos de TypeScript** relacionados con NextAuth (`session.user.id`) y con el enum `RequestStatus` de Prisma.

---

## Revisión y modificación manual

Todo el código generado por IA fue **leído, ejecutado y validado** antes de integrarse. En particular:

- **Decisiones de arquitectura:** las alternativas documentadas en `ARCHITECTURE.md` (monolito vs. backend separado, JWT vs. sesiones persistidas, políticas puras vs. lógica en el handler) fueron evaluadas y elegidas conscientemente, no aceptadas por defecto.
- **Modelo de datos:** el uso sistemático de `findFirst({ where: { id, tenantId } })` en lugar de `findUnique({ where: { id } })` fue una decisión explícita para forzar el aislamiento multi-tenant en cada acceso por ID.
- **Reglas de negocio:** las transiciones de estado válidas (`DRAFT → SUBMITTED → APPROVED | REJECTED`) y las restricciones por rol (`ADMIN` puede aprobar/rechazar, `MEMBER` no) fueron verificadas manualmente y cubiertas por tests.
- **Autenticación:** se decidió usar JWT con NextAuth en lugar de sesiones persistidas, y se descartó el uso de `@auth/prisma-adapter` porque la estrategia elegida no lo requiere.
- **Nombres y contratos de API:** se ajustaron los nombres de campos (`changedById` vs `changeById`, `histories` vs `history`) para mantener coherencia entre el schema de Prisma, los handlers y el frontend.
- **Correcciones al borrador de `ARCHITECTURE.md`:** la versión inicial generada por IA contenía afirmaciones incorrectas sobre las versiones del stack, los nombres de archivos y la estructura del proyecto. Fueron corregidas tras contrastar con el repositorio real.
- **Fragmentos descartados:** se descartaron partes generadas que introducían complejidad innecesaria para el MVP (por ejemplo, capas de servicios o abstracciones no justificadas por el problema actual).

---

## Partes no asistidas por IA

- **Ejecución y validación del flujo end-to-end** en el navegador: login, creación, edición, envío, aprobación, rechazo, verificación del historial y del aislamiento.
- **Decisiones de scope**: qué implementar y qué dejar como deuda técnica documentada.
- **Configuración del entorno local** (Docker, puerto `5433`, migraciones, seed).
- **Verificación de reproducibilidad**: ejecución del proyecto desde cero en un entorno limpio siguiendo el `README.md`.
- **Validación de tipos y linting**: ejecución de `npx tsc --noEmit` y `npm run lint` hasta dejarlos sin errores.

---

## Reflexión sobre el uso de IA

La IA aceleró tareas mecánicas (scaffolding, generación de componentes, redacción de documentación) y ayudó a detectar problemas de tipos y de esquema que podían haber pasado desapercibidos. Sin embargo, **no sustituyó el juicio técnico**: las decisiones de arquitectura, la estrategia multi-tenant, el modelo de datos y las reglas de negocio fueron evaluadas y ajustadas manualmente.

La revisión del resultado fue indispensable. Varias sugerencias de IA contenían suposiciones incorrectas sobre el proyecto (nombres de archivos, versiones, rutas) que hubieran degradado la calidad de la entrega si se aceptaban sin verificar. El criterio aplicado fue el mismo que con cualquier contribución externa: leer, entender, probar y ajustar antes de integrar.
