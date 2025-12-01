# Animal Rescue Platform - Backend API

API backend para plataforma de rescate de animales perdidos, encontrados y heridos.

## 🚀 Características

- ✅ Registro y autenticación de usuarios (simple y rápido)
- ✅ Reportes de animales (perdido, encontrado, herido)
- ✅ Sistema de matches automático entre animales perdidos y encontrados
- ✅ Geolocalización y búsqueda por proximidad
- ✅ Directorio de veterinarias con modelo freemium (patrocinadas primero)
- ✅ Directorio de refugios (siempre gratuitos)
- ✅ Panel de administración para gestionar veterinarias y refugios
- ✅ Notificaciones de matches

## 📋 Requisitos

- Node.js 18+
- PostgreSQL 14+
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio e instalar dependencias**

```bash
npm install
```

2. **Configurar variables de entorno**

Copiar `.env.example` a `.env` y configurar:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/animal_rescue_db"
JWT_SECRET="tu-secreto-muy-seguro"
PORT=3000
```

3. **Configurar la base de datos**

```bash
# Generar el cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para ver los datos
npm run prisma:studio
```

4. **Crear un usuario admin inicial**

Ejecutar este script SQL en tu base de datos:

```sql
-- Password: admin123 (cambiar en producción)
INSERT INTO "Admin" (id, email, password, role)
VALUES (
  gen_random_uuid(),
  'admin@animalrescue.com',
  '$2a$10$rHqGZxJz5N6mKxQvPzV5qOwJmZYZj0Wg4nPvXhZKJy2yKiJCGcYqm',
  'SUPER_ADMIN'
);
```

5. **Iniciar el servidor**

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

El servidor estará corriendo en `http://localhost:3000`

## 📚 API Endpoints

### Autenticación de Usuarios

#### POST `/api/auth/register`
Registro rápido de usuario.

```json
{
  "name": "Juan Pérez",
  "phone": "987654321",
  "password": "password123",
  "email": "juan@email.com", // opcional
  "location": "Chincha" // opcional
}
```

#### POST `/api/auth/login`
Login de usuario.

```json
{
  "phone": "987654321",
  "password": "password123"
}
```

#### GET `/api/auth/profile`
Obtener perfil del usuario autenticado.
- Requiere: `Authorization: Bearer {token}`

---

### Reportes

#### POST `/api/reports`
Crear un nuevo reporte.
- Requiere: `Authorization: Bearer {token}`

```json
{
  "type": "LOST", // LOST | FOUND | INJURED
  "animalType": "perro",
  "description": "Perro mediano, color café, collar rojo",
  "photoUrl": "https://cloudinary.com/...",
  "latitude": -13.4103,
  "longitude": -76.1344,
  "address": "Av. José de San Martín 234",
  "district": "Chincha Alta",
  "province": "Chincha",
  "contactPhone": "987654321",
  "contactName": "Juan Pérez"
}
```

#### GET `/api/reports/nearby?latitude=-13.4103&longitude=-76.1344&radius=10&type=LOST`
Obtener reportes cercanos.
- Query params:
  - `latitude` (requerido)
  - `longitude` (requerido)
  - `radius` (opcional, default: 10km)
  - `type` (opcional: LOST, FOUND, INJURED)
  - `status` (opcional, default: ACTIVE)

#### GET `/api/reports/my-reports`
Obtener mis reportes.
- Requiere: `Authorization: Bearer {token}`

#### GET `/api/reports/:id`
Obtener un reporte específico.

#### PATCH `/api/reports/:id/status`
Actualizar estado del reporte.
- Requiere: `Authorization: Bearer {token}`

```json
{
  "status": "RESOLVED" // ACTIVE | RESOLVED | CLOSED
}
```

---

### Matches

#### GET `/api/matches/my-matches`
Obtener todos mis matches (animales perdidos que coinciden con encontrados).
- Requiere: `Authorization: Bearer {token}`

#### GET `/api/matches/report/:reportId`
Obtener matches de un reporte específico.
- Requiere: `Authorization: Bearer {token}`

#### PATCH `/api/matches/:matchId/notified`
Marcar match como notificado.
- Requiere: `Authorization: Bearer {token}`

---

### Veterinarias

#### GET `/api/veterinaries/nearby?latitude=-13.4103&longitude=-76.1344&radius=20`
Obtener veterinarias cercanas (patrocinadas primero).
- Query params:
  - `latitude` (requerido)
  - `longitude` (requerido)
  - `radius` (opcional, default: 20km)

Respuesta ordenada por:
1. Plan (ENTERPRISE > PREMIUM > BASIC > FREE)
2. Distancia (más cercana primero)

#### GET `/api/veterinaries`
Obtener todas las veterinarias.
- Query params:
  - `plan` (opcional: FREE, BASIC, PREMIUM, ENTERPRISE)
  - `isActive` (opcional: true, false)
  - `district` (opcional)

#### GET `/api/veterinaries/:id`
Obtener una veterinaria específica.

---

### Refugios

#### GET `/api/shelters/nearby?latitude=-13.4103&longitude=-76.1344&radius=50`
Obtener refugios cercanos.
- Query params:
  - `latitude` (requerido)
  - `longitude` (requerido)
  - `radius` (opcional, default: 50km)

#### GET `/api/shelters`
Obtener todos los refugios.

#### GET `/api/shelters/:id`
Obtener un refugio específico.

---

### Admin (Gestión)

Todos los endpoints admin requieren: `Authorization: Bearer {admin-token}`

#### POST `/api/admin/login`
Login de administrador.

```json
{
  "email": "admin@animalrescue.com",
  "password": "admin123"
}
```

#### GET `/api/admin/dashboard/stats`
Obtener estadísticas del dashboard.

#### Gestión de Veterinarias

- `POST /api/admin/veterinaries` - Crear veterinaria
- `PUT /api/admin/veterinaries/:id` - Actualizar veterinaria
- `PATCH /api/admin/veterinaries/:id/plan` - Actualizar plan de patrocinio
- `PATCH /api/admin/veterinaries/:id/toggle` - Activar/desactivar
- `DELETE /api/admin/veterinaries/:id` - Eliminar

Ejemplo actualizar plan:
```json
{
  "plan": "PREMIUM",
  "planStartDate": "2024-01-01",
  "planEndDate": "2024-12-31"
}
```

#### Gestión de Refugios

- `POST /api/admin/shelters` - Crear refugio
- `PUT /api/admin/shelters/:id` - Actualizar refugio
- `PATCH /api/admin/shelters/:id/toggle` - Activar/desactivar
- `DELETE /api/admin/shelters/:id` - Eliminar

---

## 🎯 Modelo de Negocio

### Planes de Veterinarias

1. **FREE** (Gratis)
   - Aparecen en el listado después de las patrocinadas
   - Ordenadas por distancia

2. **BASIC** (Pago)
   - Aparecen destacadas en el listado
   - Badge "Destacado"

3. **PREMIUM** (Pago)
   - Primeras en la lista
   - Badge "Premium"
   - Perfil destacado

4. **ENTERPRISE** (Pago)
   - Todo lo anterior
   - Notificaciones de reportes cercanos
   - Estadísticas detalladas

### Refugios
- Siempre **GRATUITOS**
- Apoyan la causa social de la plataforma

---

## 🔍 Sistema de Matches

Cuando un usuario reporta un animal **PERDIDO** o **ENCONTRADO**, el sistema automáticamente:

1. Busca reportes del tipo opuesto en la misma zona (últimos 30 días)
2. Calcula un score de coincidencia (0-100) basado en:
   - Distancia entre reportes
   - Tipo de animal
   - Tiempo entre reportes
3. Crea matches con score >= 50
4. El usuario puede ver sus matches y contactar directamente

---

## 🗂️ Estructura de la Base de Datos

### Tablas principales:

- **User** - Usuarios de la plataforma
- **Report** - Reportes de animales
- **Match** - Coincidencias entre reportes LOST/FOUND
- **Veterinary** - Veterinarias registradas
- **Shelter** - Refugios registrados
- **Admin** - Administradores del sistema

Ver `prisma/schema.prisma` para el esquema completo.

---

## 🔐 Seguridad

- Passwords hasheados con bcrypt
- Autenticación JWT
- Validación de datos en todos los endpoints
- Protección de rutas admin
- CORS configurado

---

## 📱 Próximos Pasos

1. **Frontend Web App**
   - Interfaz de usuario para reportes
   - Mapa interactivo
   - Sistema de notificaciones
   - Vista de matches

2. **Panel Admin**
   - Dashboard con estadísticas
   - Gestión de veterinarias y refugios
   - Control de pagos/suscripciones

3. **Funcionalidades adicionales**
   - Upload de imágenes (Cloudinary)
   - Notificaciones push
   - Chat in-app (futuro)
   - Integración con WhatsApp Business

---

## 🤝 Contribuir

1. Fork del proyecto
2. Crear una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 💡 Notas de Desarrollo

- El sistema de geolocalización usa fórmula de Haversine para precisión
- Los matches se crean automáticamente al crear un reporte LOST/FOUND
- Las veterinarias patrocinadas siempre aparecen primero, sin importar la distancia
- Para testing, usar Postman o similar con las colecciones incluidas

---

¿Necesitas ayuda? Abre un issue en GitHub.
