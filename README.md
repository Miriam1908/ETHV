# LikeTalent — Centro de Talento y Habilidades

Una plataforma de validación de talento y habilidades — subes tu CV, la IA lo analiza, extrae skills, genera un CV optimizado para ATS, y valida tus habilidades en blockchain.

## Stack

**Frontend**
- Vite + React 19 + TypeScript
- TailwindCSS + Framer Motion
- wagmi + Web3Modal (wallet connect)
- React Router v6

**Backend** (`backend/`)
- Node.js + Express (CommonJS `.cjs`)
- MiniMax-M2.5 vía API compatible con Anthropic (`api.minimax.io`)
- Supabase (PostgreSQL) para persistencia
- OAuth 2.0: Google, LinkedIn, GitHub
- pdfjs-dist (legacy build) para extracción de texto PDF

## Arquitectura

```
localhost:3000  →  Vite dev server (React)
localhost:3003  →  Express backend
```

Vite proxea `/api`, `/v1`, `/auth` → puerto 3003.

## Funcionalidades

| Feature | Estado |
|---|---|
| Subida y análisis de CV (PDF, DOCX, TXT, MD) | ✅ |
| Extracción de skills, experiencia, educación | ✅ |
| Score ATS + dimensiones (claridad, impacto, etc.) | ✅ |
| Generación de CV optimizado para ATS | ✅ |
| Adaptar CV a oferta de trabajo | ✅ |
| Análisis de perfil LinkedIn | ✅ |
| Autenticación: Wallet (wagmi), Google, LinkedIn, GitHub | ✅ |
| Persistencia en Supabase | ✅ |
| Selector de idioma global (ES / EN) | ✅ |

## Estructura

```
/
├── src/                        # Frontend React
│   ├── App.tsx                 # Providers: Wagmi, Auth, Lang, Router
│   ├── store/
│   │   ├── AuthContext.tsx     # Token auth (localStorage)
│   │   └── LangContext.tsx     # Idioma global ES/EN
│   ├── pages/
│   │   ├── Landing.tsx         # Hero + OAuth + wallet + CTA "Sube tu CV"
│   │   ├── CVUpload.tsx        # Upload + análisis IA + CV ATS
│   │   ├── Dashboard.tsx       # Stats y accesos rápidos
│   │   ├── Validation.tsx      # Quiz de skills + badges on-chain
│   │   ├── Opportunities.tsx   # Job board con match scores
│   │   └── AuthCallback.tsx    # Callback OAuth → token → redirect
│   ├── components/
│   │   ├── Navbar.tsx          # Logo LikeTalent + nav + selector idioma
│   │   ├── CVPreview.tsx       # Previsualización CV ATS generado
│   │   └── ProtectedRoute.tsx  # Guarda rutas (wallet o VITE_WALLET_BYPASS)
│   ├── hooks/useWallet.ts
│   ├── services/apiClient.ts
│   └── web3/config.ts
│
├── backend/                    # Backend Express
│   ├── index.cjs               # Servidor principal (puerto 3003)
│   ├── ai.cjs                  # callAI() + parseJSON() (state machine)
│   ├── package.json
│   ├── .env                    # Variables locales (no commitear)
│   ├── .env.example            # Template de variables
│   └── supabase-schema.sql     # DDL tablas Supabase
│
├── .mcp.json                   # MCP Supabase (local, en .gitignore)
└── CLAUDE.md                   # Instrucciones para Claude Code
```

## Base de datos (Supabase)

Ejecutar `backend/supabase-schema.sql` en Supabase Dashboard → SQL Editor.

Tablas:
- `cv_analyses` — cada análisis de CV con scores, skills, datos de contacto
- `auth_sessions` — logins OAuth (Google, LinkedIn, GitHub, wallet)
- `cv_improvements` — CVs ATS generados/mejorados

## Variables de entorno

### Frontend (`.env` en raíz)

```env
VITE_WALLETCONNECT_PROJECT_ID=...
VITE_BACKEND_URL=http://localhost:3003
VITE_WALLET_BYPASS=true          # Omite auth de wallet en desarrollo
```

### Backend (`backend/.env`)

Ver `backend/.env.example` para la lista completa. Principales:

```env
PORT=3003

# IA (intercambiable sin tocar código)
AI_PROVIDER=anthropic
AI_BASE_URL=https://api.minimax.io/anthropic
AI_API_KEY=...
AI_MODEL=MiniMax-M2.5

# Supabase
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<service_role_key>

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3003
```

## Comandos

```bash
# Desarrollo
npm run dev          # Frontend (puerto 3000)
npm run server       # Backend  (puerto 3003)
npm run dev:all      # Ambos simultáneamente

# Producción
npm run build
npm run preview

# Utilidades
npm run lint         # TypeScript check (tsc --noEmit)
npm run clean        # Elimina /dist
```

Backend (separado):
```bash
cd backend
npm install
npm run dev
```

## Endpoints principales

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/analyze-cv` | Analiza CV (base64) con IA |
| POST | `/api/improve-cv` | Genera CV ATS optimizado |
| POST | `/api/tailor-cv` | Adapta CV a oferta de trabajo |
| POST | `/api/linkedin-scrape` | Analiza perfil LinkedIn |
| GET | `/api/supabase-status` | Diagnóstico conexión Supabase |
| GET | `/auth/google` | Inicia OAuth Google |
| GET | `/auth/linkedin` | Inicia OAuth LinkedIn |
| GET | `/auth/github` | Inicia OAuth GitHub |
| GET | `/health` | Healthcheck |
| GET | `/api-docs` | Swagger UI |

## Proveedor de IA

El backend soporta cualquier proveedor compatible con la API de Anthropic o OpenAI. Cambia estas 4 líneas en `backend/.env` sin tocar código:

```env
# Claude (Anthropic)
AI_PROVIDER=anthropic
AI_BASE_URL=https://api.anthropic.com
AI_API_KEY=sk-ant-...
AI_MODEL=claude-sonnet-4-6

# GPT-4o
AI_PROVIDER=openai
AI_BASE_URL=https://api.openai.com
AI_API_KEY=sk-...
AI_MODEL=gpt-4o

# DeepSeek
AI_PROVIDER=openai
AI_BASE_URL=https://api.deepseek.com
AI_API_KEY=sk-...
AI_MODEL=deepseek-chat
```

## Contribuir

1. `git checkout -b feature/mi-cambio`
2. Commits pequeños y descriptivos
3. Pull request hacia `master`
