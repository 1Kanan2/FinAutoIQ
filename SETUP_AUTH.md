# 🚗 Crédito Vehicular - Aplicación Financiera

Aplicación web de crédito vehicular para entidades financieras en Perú, construida con Next.js 14, TypeScript, Tailwind CSS y Supabase.

## ✅ Componentes Implementados

### 1. Cliente de Supabase (`lib/supabase.ts`)
- Cliente de Supabase optimizado para navegador
- Usa `@supabase/ssr` para mejor integración con Next.js
- Variables de entorno configuradas en `.env.local`

### 2. Middleware de Autenticación (`middleware.ts`)
- Protege todas las rutas excepto `/login` y `/register`
- Redirige usuarios no autenticados a login
- Redirige usuarios autenticados desde login/register al dashboard
- Mantiene sesiones entre navegación de páginas

### 3. Página de Login (`app/login/page.tsx`)
- Autenticación con email y contraseña
- Integración completa con Supabase Auth
- Validación de campos
- Manejo de errores
- Diseño profesional con Tailwind CSS
- Enlace a registro para nuevos usuarios

### 4. Página de Registro (`app/register/page.tsx`)
- Creación de nuevas cuentas
- Validación de contraseñas (mínimo 6 caracteres)
- Confirmación de contraseña
- Redirección automática a login después de registro exitoso
- Diseño consistente con la página de login
- Manejo de errores y mensajes de éxito

### 5. Layout Principal con Navbar (`app/layout.tsx` + `components/navbar.tsx`)
- Navbar que se oculta en páginas de login/registro
- Muestra email del usuario logueado
- Botón de cerrar sesión funcional
- Navegación responsiva
- Branding de la empresa

### 6. Dashboard (`app/dashboard/page.tsx`)
- Página protegida para usuarios autenticados
- Punto de entrada después de login

## 🚀 Configuración Inicial

### Variables de Entorno
Ya están configuradas en `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://dszqmgsyschndovxwygb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Instalación de Dependencias
Las dependencias ya están instaladas. Si necesitas instalar nuevas:
```bash
npm install
```

### Ejecutar en Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`

## 📋 Flujo de Autenticación

1. **Visitante sin sesión** → Redirigido a `/login`
2. **En login**: Ingresa email y contraseña → Si son válidos, redirigido a `/dashboard`
3. **En registro**: Crea nueva cuenta → Redirigido automático a login
4. **En dashboard**: Puede ver su email en el navbar → Botón "Cerrar Sesión" disponible
5. **Después de logout**: Redirigido a `/login`

## 🎨 Diseño

- **Colores**: Gradient azul-índigo para coherencia visual
- **Componentes**: Tarjetas redondeadas con sombra
- **Responsive**: Diseño adaptable a todos los dispositivos
- **Accesibilidad**: Labels apropiados, contraste adecuado

## 📦 Estructura del Proyecto

```
credito-vehicular-fie/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard (protegido)
│   ├── login/
│   │   └── page.tsx          # Página de login
│   ├── register/
│   │   └── page.tsx          # Página de registro
│   ├── layout.tsx            # Layout principal con navbar
│   └── globals.css           # Estilos globales
├── components/
│   └── navbar.tsx            # Componente de navegación
├── lib/
│   └── supabase.ts           # Cliente de Supabase
├── middleware.ts             # Middleware de protección de rutas
├── .env.local                # Variables de entorno
├── tsconfig.json             # Configuración TypeScript
├── tailwind.config.ts        # Configuración Tailwind
└── package.json              # Dependencias del proyecto
```

## 🔒 Seguridad

- Contraseñas mínimo 6 caracteres (configurable en Supabase)
- Validación en cliente y en Supabase
- Tokens JWT seguros de Supabase
- Middleware protege rutas en el servidor

## 🚀 Próximos Pasos

Para expandir la aplicación, podrías:
- Agregar más páginas protegidas (solicitudes de crédito, historial, etc.)
- Crear tablas en Supabase para almacenar solicitudes de crédito
- Agregar rol de administrador
- Implementar notificaciones por email
- Agregar 2FA (autenticación de dos factores)
- Crear dashboard con estadísticas

## 📚 Recursos

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

## 📝 Notas

- Asegúrate de que las variables de entorno de Supabase sean válidas
- Supabase debe estar configurado con auth habilitado
- Los usuarios pueden registrarse directamente sin necesidad de invitaciones (configurable en Supabase)
