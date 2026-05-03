
-- CitaSmartGG MVP - Schema MySQL


CREATE DATABASE IF NOT EXISTS citasmartgg_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE citasmartgg_db;

-- -----------------------------------------------
-- ROLES
-- -----------------------------------------------
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- USUARIOS
-- -----------------------------------------------
CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- -----------------------------------------------
-- PACIENTES
-- -----------------------------------------------
CREATE TABLE pacientes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  documento VARCHAR(30) NOT NULL UNIQUE,
  tipo_documento ENUM('CC','TI','CE','PASAPORTE') DEFAULT 'CC',
  fecha_nacimiento DATE,
  telefono VARCHAR(20),
  email VARCHAR(150),
  direccion VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- -----------------------------------------------
-- ESPECIALIDADES
-- -----------------------------------------------
CREATE TABLE especialidades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  activa BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------
-- PROFESIONALES
-- -----------------------------------------------
CREATE TABLE profesionales (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  documento VARCHAR(30) NOT NULL UNIQUE,
  email VARCHAR(150),
  telefono VARCHAR(20),
  especialidad_id INT,
  registro_medico VARCHAR(50),
  usuario_id INT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (especialidad_id) REFERENCES especialidades(id) ON DELETE SET NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);
-- -----------------------------------------------
-- SERVICIOS
-- -----------------------------------------------
CREATE TABLE servicios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(150) NOT NULL,
  descripcion VARCHAR(500),
  duracion_minutos INT NOT NULL DEFAULT 30,
  precio DECIMAL(10,2) DEFAULT 0.00,
  especialidad_id INT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (especialidad_id) REFERENCES especialidades(id) ON DELETE SET NULL
);
-- -----------------------------------------------
-- HORARIOS 
-- -----------------------------------------------
CREATE TABLE horarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  profesional_id INT NOT NULL,
  dia_semana TINYINT NOT NULL COMMENT '0=Dom,1=Lun,...,6=Sab',
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_horario (profesional_id, dia_semana, hora_inicio),
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
  CHECK (hora_fin > hora_inicio)
);

-- -----------------------------------------------
-- BLOQUEOS
-- -----------------------------------------------
CREATE TABLE bloqueos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  profesional_id INT NOT NULL,
  fecha_inicio DATETIME NOT NULL,
  fecha_fin DATETIME NOT NULL,
  motivo VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  CHECK (fecha_fin > fecha_inicio)
);

-- -----------------------------------------------
-- CITAS
-- -----------------------------------------------
CREATE TABLE citas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paciente_id INT NOT NULL,
  profesional_id INT NOT NULL,
  servicio_id INT NOT NULL,
  fecha_hora_inicio DATETIME NOT NULL,
  fecha_hora_fin DATETIME NOT NULL,
  estado ENUM('agendada','confirmada','cancelada','completada','no_asistio') DEFAULT 'agendada',
  motivo_consulta TEXT,
  observaciones TEXT,
  motivo_cancelacion VARCHAR(255),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
  FOREIGN KEY (profesional_id) REFERENCES profesionales(id),
  FOREIGN KEY (servicio_id) REFERENCES servicios(id),
  FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
  CHECK (fecha_hora_fin > fecha_hora_inicio)
);

-- -----------------------------------------------
-- ÍNDICES
-- -----------------------------------------------
CREATE INDEX idx_citas_fecha          ON citas(fecha_hora_inicio);
CREATE INDEX idx_citas_profesional    ON citas(profesional_id, fecha_hora_inicio);
CREATE INDEX idx_citas_paciente       ON citas(paciente_id);
CREATE INDEX idx_citas_estado         ON citas(estado);
CREATE INDEX idx_bloqueos_profesional ON bloqueos(profesional_id, fecha_inicio);