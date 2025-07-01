# Frontend - Sistema de Gestión

## 🚀 Despliegue en Vercel

### Requisitos previos
- Backend desplegado en Render.com
- Cuenta en Vercel
- Configuración de Clerk Authentication

### Variables de entorno necesarias en Vercel

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
VITE_CLERK_DOMAIN=your-clerk-domain.clerk.accounts.dev
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_NODE_ENV=production
```

### Pasos para desplegar

1. **Preparar el backend primero**
   - Asegurar que tu backend esté funcionando en Render
   - Obtener la URL del backend (ej: https://mi-backend.onrender.com)

2. **Crear proyecto en Vercel**
   - Ir a https://vercel.com/
   - "New Project" → Conectar repositorio GitHub
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Configurar variables de entorno**
   - En el dashboard de Vercel → Settings → Environment Variables
   - Agregar todas las variables listadas arriba

4. **Actualizar CORS en el backend**
   - Agregar el dominio de Vercel a CORS_ORIGINS
   - Ejemplo: `CORS_ORIGINS=https://mi-frontend.vercel.app`

### Comandos disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Verificar configuración para Vercel
npm run check-vercel

# Verificar build local
npm run check-build
```

### Tecnologías utilizadas
- React 19 + Vite
- Tailwind CSS
- Clerk Authentication
- React Router DOM
- Lucide React Icons

### Estructura del proyecto
```
my-app/
├── public/           # Archivos estáticos
├── src/             
│   ├── components/   # Componentes React
│   ├── context/      # Contextos de React
│   ├── hooks/        # Custom hooks
│   ├── pages/        # Páginas principales
│   └── services/     # Servicios API
├── vercel.json       # Configuración de Vercel
└── vite.config.js    # Configuración de Vite
```

### Optimizaciones incluidas
- ✅ Code splitting automático
- ✅ Compresión de assets
- ✅ Cache de dependencias
- ✅ SEO optimizado
- ✅ SPA routing configurado
- ✅ Performance optimizations

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
