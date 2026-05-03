
-- CitaSmartGG MVP - Datos semilla (seed)
-- Ejecutar después de schema.sql

USE citasmartgg_db;

-- -----------------------------------------------
-- ROLES
-- -----------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
  ('admin',       'Administrador del sistema'),
  ('profesional', 'Médico o profesional de salud');

-- -----------------------------------------------
-- USUARIOS
-- Todas las contraseñas son: Admin123! / Doctor123!
-- Hash generado con bcrypt 10 rounds
-- -----------------------------------------------
INSERT INTO usuarios (nombre, apellido, email, password_hash, rol_id) VALUES
  ('Admin',   'Sistema',   'admin@medcitas.com',
   '$2b$10$rOHdm1EmA.2HpV4hRQNsXOjJ4VXxJQJkQsGKN6zmRjPdJBCqE2QVK', 1),

  ('Carlos',  'Gómez',     'doctor@medcitas.com',
   '$2b$10$rOHdm1EmA.2HpV4hRQNsXOjJ4VXxJQJkQsGKN6zmRjPdJBCqE2QVK', 3),

  ('Ana',     'Rodríguez', 'doctora@medcitas.com',
   '$2b$10$rOHdm1EmA.2HpV4hRQNsXOjJ4VXxJQJkQsGKN6zmRjPdJBCqE2QVK', 3);

-- -----------------------------------------------
-- ESPECIALIDADES
-- -----------------------------------------------
INSERT INTO especialidades (nombre) VALUES
  ('Medicina General'),
  ('Odontología'),
  ('Pediatría'),
  ('Ginecología'),
  ('Cardiología');

-- -----------------------------------------------
-- PROFESIONALES
-- usuario_id vinculado con los usuarios de rol profesional
-- -----------------------------------------------
INSERT INTO profesionales (nombre, apellido, documento, email, especialidad_id, registro_medico, usuario_id) VALUES
  ('Carlos', 'Gómez',     '98765432', 'doctor@medcitas.com',
   (SELECT id FROM especialidades WHERE nombre = 'Medicina General'),  'RM-00123',
   (SELECT id FROM usuarios WHERE email = 'doctor@medcitas.com')),

  ('Ana',    'Rodríguez', '87654321', 'doctora@medcitas.com',
   (SELECT id FROM especialidades WHERE nombre = 'Pediatría'),         'RM-00456',
   (SELECT id FROM usuarios WHERE email = 'doctora@medcitas.com'));

-- -----------------------------------------------
-- SERVICIOS
-- -----------------------------------------------
INSERT INTO servicios (nombre, descripcion, duracion_minutos, precio, especialidad_id) VALUES
  ('Consulta médica general',  'Consulta de medicina general',           30, 50000.00,
   (SELECT id FROM especialidades WHERE nombre = 'Medicina General')),

  ('Control pediátrico',       'Control de crecimiento y desarrollo',    30, 60000.00,
   (SELECT id FROM especialidades WHERE nombre = 'Pediatría')),

  ('Consulta ginecológica',    'Consulta de ginecología y obstetricia',  40, 80000.00,
   (SELECT id FROM especialidades WHERE nombre = 'Ginecología')),

  ('Electrocardiograma',       'Examen de actividad eléctrica del corazón', 20, 70000.00,
   (SELECT id FROM especialidades WHERE nombre = 'Cardiología')),

  ('Limpieza dental',          'Profilaxis y limpieza oral',             45, 90000.00,
   (SELECT id FROM especialidades WHERE nombre = 'Odontología'));

-- -----------------------------------------------
-- HORARIOS (Lunes a Viernes, 08:00 - 17:00)
-- dia_semana: 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie
-- -----------------------------------------------
INSERT INTO horarios (profesional_id, dia_semana, hora_inicio, hora_fin)
SELECT p.id, d.dia, '08:00', '12:00'
FROM profesionales p
CROSS JOIN (SELECT 1 AS dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d
WHERE p.activo = 1;

INSERT INTO horarios (profesional_id, dia_semana, hora_inicio, hora_fin)
SELECT p.id, d.dia, '14:00', '17:00'
FROM profesionales p
CROSS JOIN (SELECT 1 AS dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d
WHERE p.activo = 1;

-- -----------------------------------------------
-- PACIENTES DE EJEMPLO
-- -----------------------------------------------
INSERT INTO pacientes (nombre, apellido, documento, tipo_documento, telefono, email, fecha_nacimiento) VALUES
  ('Juan',    'Pérez',    '1234567890', 'CC', '3001234567', 'juan@email.com',    '1985-03-15'),
  ('María',   'López',    '0987654321', 'CC', '3109876543', 'maria@email.com',   '1990-07-22'),
  ('Pedro',   'Sánchez',  '1122334455', 'CC', '3201122334', 'pedro@email.com',   '1978-11-08'),
  ('Lucía',   'Ramírez',  '5544332211', 'CC', '3155544332', 'lucia@email.com',   '2000-01-30'),
  ('Sofía',   'Torres',   '6677889900', 'CC', '3006677889', 'sofia@email.com',   '1995-06-10');