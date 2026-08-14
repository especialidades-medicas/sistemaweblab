CREATE DATABASE IF NOT EXISTS sistema_laboratorio CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_laboratorio;

CREATE TABLE IF NOT EXISTS pacientes (
    cedula VARCHAR(20) NOT NULL PRIMARY KEY,
    nombres VARCHAR(150) NULL,
    edad INT NULL,
    telefono VARCHAR(30) NULL,
    direccion TEXT NULL,
    correo VARCHAR(100) NULL,
    fecha_nacimiento DATE NULL,
    sexo VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ingresos_paciente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cedula VARCHAR(20) NOT NULL,
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    historia_fisiterapia TEXT NULL,
    historia_podologia TEXT NULL,
    historia_medicina_general TEXT NULL,
    historia_otros TEXT NULL,
    CONSTRAINT fk_paciente_ingreso FOREIGN KEY (cedula) REFERENCES pacientes(cedula) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;