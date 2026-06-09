# 🧪 Guía de Prueba - Autenticación

## Paso 1: Registrarse
1. Ve a `http://localhost:3000/register`
2. Completa los campos:
   - Correo: `tu_email@ejemplo.com`
   - Contraseña: `MiContraseña123`
   - Confirmar contraseña: `MiContraseña123`
3. Haz clic en "Crear Cuenta"
4. Deberías ver un mensaje de éxito y serás redirigido a login

## Paso 2: Iniciar Sesión
1. En la página de login, ingresa:
   - Correo: `tu_email@ejemplo.com`
   - Contraseña: `MiContraseña123`
2. Haz clic en "Iniciar Sesión"
3. Serás redirigido al dashboard

## Paso 3: Verificar Protección de Rutas
1. Una vez autenticado, deberías ver:
   - Navbar con tu email
   - Botón "Cerrar Sesión"
2. El navbar desaparece en páginas de login/registro

## Paso 4: Cerrar Sesión
1. Haz clic en "Cerrar Sesión"
2. Deberías ser redirigido a `/login`

## Paso 5: Verificar Protección
1. Sin autenticarte, intenta ir a `http://localhost:3000/dashboard`
2. Deberías ser redirigido automáticamente a `/login`

## ✅ Checklist de Verificación

- [ ] Registro funciona con validación de contraseñas
- [ ] Login funciona con credenciales válidas
- [ ] Rutas protegidas redirigen a login
- [ ] Navbar muestra email del usuario
- [ ] Botón de cerrar sesión funciona
- [ ] Después de logout, se redirige a login
- [ ] Login/Register no muestran navbar
- [ ] Las credenciales inválidas muestran error

## 🐛 Solución de Problemas

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Verifica que `.env.local` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo

### Error de autenticación
- Verifica que Supabase esté activado en tu proyecto
- Comprueba que las variables de entorno sean correctas
- Revisa la consola del navegador para más detalles

### Middleware no funciona
- En Next.js 16, usa el archivo `middleware.ts` en la raíz
- Asegúrate de que esté al mismo nivel que `package.json`

## 📱 Prueba en Dispositivos Móviles
1. Desde otra máquina, accede a: `http://192.168.1.49:3000`
2. Verifica que el diseño sea responsive
3. Comprueba que los formularios funcionen correctamente
