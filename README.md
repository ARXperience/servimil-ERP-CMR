# 🚀 SERVIMIL OS — Enterprise ERP/CRM Platform

![SERVIMIL OS](https://img.shields.io/badge/SERVIMIL-OS-blue?style=for-the-badge)
![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)

Ecosistema operativo empresarial cloud-native para **SERVIMIL**. Automatización, CRM, WhatsApp IA, Crédito, Nómina, Jurídica, OCR y más.

## 📐 Arquitectura

```
servimil-ERP-CMR/
├── apps/
│   ├── api/              # NestJS Backend (Hexagonal Architecture)
│   │   ├── prisma/       # Schema, migraciones, seeds
│   │   └── src/
│   │       ├── common/   # Guards, Filters, Interceptors, DTOs
│   │       ├── database/ # Prisma Service
│   │       ├── events/   # Domain Events & Handlers
│   │       ├── integrations/ # AI, OCR providers
│   │       ├── modules/  # Feature modules
│   │       ├── queues/   # BullMQ processors
│   │       └── websockets/ # Socket.IO gateway
│   └── web/              # Next.js 15 Frontend
│       ├── app/          # App Router pages
│       ├── components/   # UI & Layout components
│       ├── hooks/        # React Query hooks
│       ├── lib/          # Utilities
│       ├── providers/    # Context providers
│       └── stores/       # Zustand stores
├── docker-compose.yml
├── turbo.json
└── package.json
```

## 🛠 Stack Tecnológico

### Backend
- **NestJS 10** — Framework enterprise con hexagonal architecture
- **Prisma ORM** — Type-safe database access
- **PostgreSQL 16** — Base de datos principal
- **Redis** — Caché y colas
- **BullMQ** — Queue system para OCR, AI, notificaciones
- **Socket.IO** — Real-time WebSockets
- **Passport + JWT** — Autenticación con refresh tokens
- **Swagger** — Documentación API automática

### Frontend
- **Next.js 15** — React Server Components, App Router
- **TypeScript** — Tipado estricto
- **TailwindCSS** — Styling utility-first
- **Shadcn UI** — Componentes premium
- **Zustand** — State management
- **React Query** — Data fetching & caching
- **Framer Motion** — Animaciones
- **Recharts** — Visualización de datos
- **Socket.IO Client** — Real-time

### Integraciones
- **OpenAI / Gemini / Claude** — IA multi-modelo
- **Baileys** — WhatsApp Multi-Device (conexión real QR)
- **Tesseract.js** — OCR local
- **Supabase** — Auth auxiliar y Realtime

## 📦 Módulos

| Módulo | Descripción |
|--------|-------------|
| 💰 **Finanzas** | Dashboard financiero, transacciones, PyG, flujo de caja, conciliación |
| 👥 **Nómina** | Cálculo nómina colombiana, PILA, cesantías, prima, seguridad social |
| 💳 **Crédito** | Solicitudes, amortización, cartera, cobranza, scoring |
| 🎯 **CRM** | Leads, pipeline Kanban, actividades, automatizaciones, funnels |
| 💬 **WhatsApp** | Conexión real QR, bandeja CRM, IA conversacional, historial |
| ⚖️ **Jurídica** | Casos, agenda, calendario, vencimientos, expedientes |
| 📄 **Documentos** | Upload, OCR, clasificación, extracción de datos |
| 🤖 **IA** | Gateway multi-modelo, análisis, scoring, resumen, sentimiento |
| 📊 **Reportes** | Dashboards ejecutivos con datos reales |
| 🔔 **Notificaciones** | In-app, email, WhatsApp |
| 🔐 **Auth** | JWT, RBAC, refresh tokens, audit logs |

## 🚀 Quick Start

### Requisitos
- Node.js >= 20
- Docker & Docker Compose
- Git

### 1. Clonar e instalar

```bash
git clone <repo-url> servimil-ERP-CMR
cd servimil-ERP-CMR
cp .env.example .env
```

### 2. Levantar infraestructura

```bash
docker-compose up -d postgres redis
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Base de datos

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Ejecutar

```bash
# Desde la raíz del monorepo
npm run dev
```

- 🌐 **Frontend**: http://localhost:3000
- 🔗 **API**: http://localhost:3001/api/v1
- 📚 **Swagger**: http://localhost:3001/api/docs

### Credenciales por defecto

| Email | Password | Rol |
|-------|----------|-----|
| admin@servimil.com | Admin123! | Administrador |
| financiera@servimil.com | Admin123! | Financiera |
| juridica@servimil.com | Admin123! | Jurídica |
| comercial@servimil.com | Admin123! | Comercial |
| supervisor@servimil.com | Admin123! | Supervisor |
| asesor@servimil.com | Admin123! | Asesor |

## 🐳 Docker (Full Stack)

```bash
docker-compose up -d
```

Esto levanta: PostgreSQL, Redis, API, Web, PgAdmin (opcional con `--profile tools`).

## 🔑 Variables de Entorno

Ver `.env.example` para la lista completa de variables. Las principales:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | JWT signing secret |
| `OPENAI_API_KEY` | OpenAI API key |
| `GEMINI_API_KEY` | Google Gemini key |
| `ANTHROPIC_API_KEY` | Anthropic Claude key |

## 📄 API Documentation

Swagger UI disponible en: `http://localhost:3001/api/docs`

Endpoints principales:
- `POST /api/v1/auth/login` — Login
- `GET /api/v1/finance/dashboard` — Dashboard financiero
- `GET /api/v1/crm/pipeline` — Pipeline CRM
- `POST /api/v1/whatsapp/sessions` — Crear sesión WhatsApp
- `GET /api/v1/legal/calendar` — Calendario jurídico
- `POST /api/v1/ai/analyze` — Análisis IA
- `POST /api/v1/documents/upload` — Upload + OCR

## 🏗 Deploy

### Frontend → Vercel
```bash
cd apps/web
npx vercel --prod
```

### Backend → Railway / Render
Usar el `Dockerfile` en `apps/api/`.

### Base de datos → Supabase Cloud / Railway Postgres

## 📝 Licencia

Propiedad de SERVIMIL. Todos los derechos reservados.

---

**Powered by [Centro Digital de Diseño](https://centrodigitaldediseno.com)**
