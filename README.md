# ETHV — Talent Validation (Front-end)

Proyecto front-end construido con Vite + React + TypeScript para la aplicación "ETHV Talent Validation".

Esta documentación rápida explica cómo preparar el entorno, ejecutar la aplicación en desarrollo y construir artefactos para producción. Está escrita en español y orientada a desarrolladores trabajando en Windows (PowerShell).

## Tecnologías

- Vite
- React 19 + TypeScript
- TailwindCSS
- wagmi + web3modal (integración Web3)
- viem, wagmi y librerías relacionadas para interacción con cadenas

## Requisitos

- Node.js (v18+ recomendado)
- npm o un gestor de paquetes compatible

## Variables de entorno

El proyecto usa variables de entorno desde `.env.local` en la raíz. Valores importantes que debes configurar:

- `GEMINI_API_KEY` — (aparece en el README previo) clave para integraciones relacionadas.
- `VITE_WALLETCONNECT_PROJECT_ID` — usado por WalletConnect / web3modal (ver `src/web3/config.ts`).

Si algún archivo .env no existe, crea `.env.local` (no comitees este archivo) y añade las claves necesarias:

```powershell
# ejemplo .env.local
GEMINI_API_KEY=tu_gemini_api_key
VITE_WALLETCONNECT_PROJECT_ID=tu_project_id
```

Nota: las variables de entorno con prefijo VITE_* estarán disponibles en tiempo de ejecución del cliente.

## Instalación (Windows PowerShell)

1. Clona el repositorio y abre la carpeta del proyecto.
2. Instala dependencias:

```powershell
npm install
```

3. Crea `.env.local` con las variables necesarias (ver sección anterior).

## Scripts útiles

Los scripts definidos en `package.json`:

- `npm run dev` — inicia el servidor de desarrollo (Vite). Por defecto en este proyecto se expone en el puerto 3000.
- `npm run build` — genera la build de producción en la carpeta `dist`.
- `npm run preview` — vista previa de la build localmente.
- `npm run clean` — elimina la carpeta `dist` (script definido como `rm -rf dist`).
- `npm run lint` — ejecuta TypeScript check (`tsc --noEmit`).

Ejemplo para ejecutar en PowerShell:

```powershell
npm run dev
```

Si usas Windows y `rm -rf dist` no funciona en algún entorno (PowerShell clásico), puedes eliminar `dist` con:

```powershell
Remove-Item -Recurse -Force .\dist
```

## Estructura principal del proyecto

Raíz del proyecto (resumen):

- `index.html` — entrada HTML de Vite
- `package.json` — scripts y dependencias
- `tsconfig.json`, `vite.config.ts` — configuración de TypeScript y Vite
- `src/` — código fuente
  - `main.tsx`, `App.tsx` — arranque de la app
  - `components/` — componentes reutilizables (por ejemplo `Navbar.tsx`, `ProtectedRoute.tsx`)
  - `pages/` — pantallas (Dashboard, Landing, CVUpload, Opportunities, Validation)
  - `layouts/` — layouts (ej. `MainLayout.tsx`)
  - `hooks/` — hooks personalizados (`useWallet.ts`)
  - `services/` — cliente API (`apiClient.ts`)
  - `store/` — contexto y gestión de estado (`AuthContext.tsx`)
  - `web3/` — configuración Web3 y utils (`config.ts`)
  - `types/` y `utils/` — tipos y utilitarios

## Notas sobre Web3

La configuración de la conexión Web3 se encuentra en `src/web3/config.ts`. Asegúrate de configurar `VITE_WALLETCONNECT_PROJECT_ID` en `.env.local` para que WalletConnect funcione correctamente.

## Contribuir

1. Crea una rama con tu feature o fix: `git checkout -b feature/mi-cambio`
2. Haz commits pequeños y descriptivos.
3. Abre un pull request hacia `master` cuando tu cambio esté listo.

## Licencia y contacto

Incluye aquí la información de licencia (si aplica) y cómo contactarte o al equipo del proyecto.

---

Si quieres, puedo añadir secciones adicionales (por ejemplo: guías de tests, reglas de lint o un checklist de despliegue). ¿Deseas que lo haga ahora? 
