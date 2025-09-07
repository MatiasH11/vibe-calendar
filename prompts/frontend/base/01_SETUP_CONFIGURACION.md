# 📦 FASE 1: Setup y Configuración Base

## 🎯 Objetivo
Crear el proyecto Next.js base con dependencias esenciales y estructura de directorios. **Solo configuración**, no vistas.

## 🔧 Comandos de Setup

```bash
# 1. Crear proyecto Next.js
npx create-next-app@14.1.0 frontend-project --typescript --tailwind --eslint --app --import-alias "@/*"
cd frontend-project

# 2. Dependencias esenciales
npm install zustand@4.4.7 @tanstack/react-query@5.17.15 jose@5.2.0 zod@3.22.4 clsx@2.0.0 tailwind-merge@2.2.0

# 3. shadcn/ui base
npx shadcn-ui@0.8.0 init --defaults
npx shadcn-ui@0.8.0 add button card input label

# 4. Variables de entorno (Windows)
echo NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 > .env.local
echo JWT_SECRET=vibe-calendar-jwt-secret-2024 >> .env.local

# 5. Estructura de directorios base (Windows)
mkdir types lib hooks stores components
mkdir components\ui components\common
```

## 📁 Estructura Creada

```
frontend-project/
├── types/          # Tipos TypeScript
├── lib/            # Utilidades y configuraciones
├── hooks/          # Custom hooks
├── stores/         # Estado global Zustand
├── components/
│   ├── ui/         # Componentes shadcn/ui
│   └── common/     # Componentes reutilizables
└── app/            # Next.js App Router (ya existe)
```

## ✅ Validación

```bash
# Verificar instalación
npm run dev
# Debe cargar sin errores en http://localhost:3000

# Verificar estructura (Windows)
dir types
dir lib
dir hooks  
dir stores
dir components
```

## 🎯 Resultado

- **Proyecto Next.js** funcionando
- **Dependencias base** instaladas  
- **Estructura de directorios** para desarrollo
- **Variables de entorno** configuradas
- **shadcn/ui** listo para usar

**No se crean vistas** - Solo la base para crearlas después.
