# 📋 Guía de Gestión de Clientes y Vehículos

## 1. Configuración Inicial - Crear Tablas en Supabase

Antes de usar las funcionalidades de clientes y vehículos, debes crear las tablas en Supabase.

### Pasos:
1. Ve a tu consola de Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (en el menú izquierdo)
4. Crea una nueva query
5. Copia todo el contenido del archivo `database.sql` de tu proyecto
6. Ejecuta la query haciendo clic en el botón verde "Run"

### ✅ Lo que se crea:
- **Tabla `clientes`** con campos: nombre, apellidos, DNI, email, teléfono, dirección
- **Tabla `vehiculos`** con campos: marca, modelo, año, precio en soles, precio en dólares
- **Índices** para mejorar el rendimiento
- **Políticas de Row Level Security** para seguridad

---

## 2. Gestión de Clientes

### Acceder a Clientes
- Haz clic en "Clientes" en el navbar
- O ve a `http://localhost:3000/clientes`

### Funcionalidades:

#### 📄 Ver Clientes
- Página principal que lista todos los clientes
- Muestra: Nombre, DNI, Email, Teléfono
- Botones para Editar y Eliminar

#### ➕ Crear Nuevo Cliente
1. Haz clic en "+ Nuevo Cliente"
2. Completa el formulario:
   - **Nombre**: Nombre del cliente (obligatorio)
   - **Apellidos**: Apellidos del cliente (obligatorio)
   - **DNI**: 8 dígitos numéricos (obligatorio, único)
   - **Email**: Email válido (obligatorio, único)
   - **Teléfono**: Número de teléfono (obligatorio)
   - **Dirección**: Dirección completa (obligatorio)
3. Haz clic en "Crear Cliente"

#### ✏️ Editar Cliente
1. Haz clic en "Editar" en la fila del cliente
2. Modifica los campos necesarios
3. Haz clic en "Guardar Cambios"

#### 🗑️ Eliminar Cliente
1. Haz clic en "Eliminar" en la fila del cliente
2. Confirma la acción
3. El cliente será eliminado de la base de datos

---

## 3. Gestión de Vehículos

### Acceder a Vehículos
- Haz clic en "Vehículos" en el navbar
- O ve a `http://localhost:3000/vehiculos`

### Funcionalidades:

#### 📄 Ver Vehículos
- Página principal que lista todos los vehículos
- Muestra: Marca/Modelo, Año, Precio en Soles, Precio en Dólares
- Botones para Editar y Eliminar

#### ➕ Crear Nuevo Vehículo
1. Haz clic en "+ Nuevo Vehículo"
2. Completa el formulario:
   - **Marca**: Marca del vehículo (ej: Toyota, Ford) (obligatorio)
   - **Modelo**: Modelo del vehículo (ej: Corolla, Focus) (obligatorio)
   - **Año**: Año de fabricación (obligatorio)
   - **Precio en Soles (S/)**: Precio en soles peruanos (obligatorio, > 0)
   - **Precio en Dólares (USD)**: Precio en dólares americanos (obligatorio, > 0)
3. Haz clic en "Crear Vehículo"

#### ✏️ Editar Vehículo
1. Haz clic en "Editar" en la fila del vehículo
2. Modifica los campos necesarios
3. Haz clic en "Guardar Cambios"

#### 🗑️ Eliminar Vehículo
1. Haz clic en "Eliminar" en la fila del vehículo
2. Confirma la acción
3. El vehículo será eliminado de la base de datos

---

## 4. Validaciones

### Clientes:
- ✓ Todos los campos son obligatorios
- ✓ DNI debe ser exactamente 8 dígitos numéricos
- ✓ Email debe ser válido (contener @)
- ✓ DNI y Email deben ser únicos en la base de datos

### Vehículos:
- ✓ Todos los campos son obligatorios
- ✓ Año debe estar entre 1900 y el año actual
- ✓ Precios deben ser mayores a 0
- ✓ Los precios se muestran formateados con separador de miles

---

## 5. Estructura de la Base de Datos

### Tabla `clientes`:
```sql
id           UUID (Primary Key)
nombre       TEXT
apellidos    TEXT
dni          TEXT (Unique)
email        TEXT (Unique)
telefono     TEXT
direccion    TEXT
created_at   TIMESTAMP
updated_at   TIMESTAMP
```

### Tabla `vehiculos`:
```sql
id               UUID (Primary Key)
marca            TEXT
modelo           TEXT
ano              INTEGER
precio_soles     DECIMAL
precio_dolares   DECIMAL
created_at       TIMESTAMP
updated_at       TIMESTAMP
```

---

## 6. Operaciones en la Base de Datos

### CRUD Clientes:

**Crear:**
```typescript
import { createCliente } from '@/lib/supabase-clients'
await createCliente({
  nombre: 'Juan',
  apellidos: 'Pérez',
  dni: '12345678',
  email: 'juan@example.com',
  telefono: '987654321',
  direccion: 'Calle Principal 123'
})
```

**Leer:**
```typescript
import { getClientes, getClienteById } from '@/lib/supabase-clients'
const clientes = await getClientes() // Todos los clientes
const cliente = await getClienteById('uuid') // Un cliente específico
```

**Actualizar:**
```typescript
import { updateCliente } from '@/lib/supabase-clients'
await updateCliente('uuid', {
  nombre: 'Juan',
  // ... otros campos
})
```

**Eliminar:**
```typescript
import { deleteCliente } from '@/lib/supabase-clients'
await deleteCliente('uuid')
```

### CRUD Vehículos:
Las operaciones son similares usando:
- `createVehiculo`
- `getVehiculos`
- `getVehiculoById`
- `updateVehiculo`
- `deleteVehiculo`

---

## 7. Seguridad

### Row Level Security (RLS)
- Solo usuarios autenticados pueden ver, crear, editar y eliminar registros
- Las políticas están configuradas en el archivo `database.sql`
- El middleware protege las rutas `/clientes` y `/vehiculos`

### Validaciones:
- Validación en cliente (formularios)
- Validación en servidor (Supabase)
- Manejo de errores para mejorar experiencia del usuario

---

## 8. Troubleshooting

### Error: "Table 'clientes' does not exist"
- ✓ Ejecuta el SQL del archivo `database.sql` en Supabase

### Error: "Email not unique"
- ✓ Ya existe un cliente con ese email
- ✓ Usa un email diferente

### Error: "DNI not unique"
- ✓ Ya existe un cliente con ese DNI
- ✓ Verifica el DNI ingresado

### Datos no se guardan
- ✓ Verifica que estés autenticado
- ✓ Revisa la consola del navegador (F12) para errores
- ✓ Confirma que Supabase URL y anon key están correctas en `.env.local`

---

## 9. Próximas Características

Se planean agregar:
- 📝 Solicitudes de Crédito (nueva tabla)
- 📊 Reportes y Estadísticas
- 👤 Perfiles de Usuario
- 🔐 Roles y Permisos (Admin, Empleado, etc.)
- 📧 Notificaciones por Email
