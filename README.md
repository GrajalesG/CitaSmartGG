# CitaSmartGG — Aplicación web para el control y gestión de citas médicas.

Aplicación web para el control y gestión de citas médicas consultorios privados y profesionales de la salud independientes

---

## Funcionalidades

- **Autenticación** con roles: admin y profesional
- **Calendario semanal y diario** de citas por profesional
- **Gestión de citas**: agendar, confirmar, reagendar, completar y cancelar
- **Disponibilidad en tiempo real** al agendar — muestra solo los horarios libres según la agenda del profesional
- **Pacientes**: registro y gestión completa
- **Profesionales**: registro, especialidad y vinculación con usuario del sistema
- **Servicios**: tipos de consulta con duración y precio
- **Horarios**: franjas semanales por profesional y bloqueos de fechas
- **Usuarios**: gestión de accesos y roles (solo admin)

### Acceso por rol

| Funcionalidad         | admin | profesional |
|-----------------------|:-----:|:-----------:|
| Dashboard             | ✅    | ✅         |
| Citas (todas)         | ✅    | ❌         |
| Citas (propias)       | ✅    | ✅         |
| Agendar / Reagendar   | ✅    | ✅         |
| Pacientes             | ✅    | ✅         |
| Profesionales         | ✅    | ❌         |
| Servicios             | ✅    | ❌         |
| Horarios y bloqueos   | ✅    | ❌         |
| Usuarios              | ✅    | ❌         |

> El rol **profesional** solo ve las citas asignadas a su propio registro. Para activarlo, vincula el usuario con su profesional desde el módulo de Profesionales.

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js     | 18.x           |
| npm         | 9.x            |
| MySQL       | 8.x            |

---

## Instalación

### 1. Base de datos

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

Esto crea la base de datos `citasmartgg_db` con todas las tablas y los usuarios de prueba.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales de MySQL
npm install
npm run dev
```

Corre en `http://localhost:3000`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Corre en `http://localhost:3001`

---

## Credenciales de prueba

| Email                 | Contraseña   | Rol         |
|-----------------------|--------------|-------------|
| admin@medcitas.com    | Admin123!    | admin       |
| doctor@medcitas.com   | Doctor123!   | profesional |
| doctora@medcitas.com  | Doctor123!   | profesional |