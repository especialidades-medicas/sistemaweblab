package com.laboratorio.controlador;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;

public class PacienteDAO {

    public boolean registrarPaciente(Paciente p) {
        String sql = "INSERT INTO pacientes (cedula, nombres, fecha_nacimiento, genero, telefono, correo, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = Conexion.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
             
            ps.setString(1, p.getCedula());
            ps.setString(2, p.getNombres());
            
            // Validar fecha de nacimiento (si está vacía, envía NULL)
            if (p.getFechaNacimiento() != null && !p.getFechaNacimiento().trim().isEmpty()) {
                ps.setString(3, p.getFechaNacimiento());
            } else {
                ps.setNull(3, Types.DATE);
            }
            
            // Validar género (si está vacío, envía NULL)
            if (p.getGenero() != null && !p.getGenero().trim().isEmpty()) {
                ps.setString(4, p.getGenero());
            } else {
                ps.setNull(4, Types.VARCHAR);
            }
            
            // Validar teléfono (si está vacío, envía NULL)
            if (p.getTelefono() != null && !p.getTelefono().trim().isEmpty()) {
                ps.setString(5, p.getTelefono());
            } else {
                ps.setNull(5, Types.VARCHAR);
            }
            
            // Validar correo (si está vacío, envía NULL)
            if (p.getCorreo() != null && !p.getCorreo().trim().isEmpty()) {
                ps.setString(6, p.getCorreo());
            } else {
                ps.setNull(6, Types.VARCHAR);
            }
            
            // Validar dirección (si está vacía, envía NULL)
            if (p.getDireccion() != null && !p.getDireccion().trim().isEmpty()) {
                ps.setString(7, p.getDireccion());
            } else {
                ps.setNull(7, Types.VARCHAR);
            }
            
            ps.executeUpdate();
            return true;
            
        } catch (SQLException e) {
            System.out.println("Error al registrar paciente: " + e.getMessage());
            return false;
        }
    }
}