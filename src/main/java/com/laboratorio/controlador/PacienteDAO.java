package com.laboratorio.controlador;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;

public class PacienteDAO {

    public boolean registrarPaciente(Paciente p) {
        String sql = "INSERT INTO pacientes (cedula, nombres, fecha_nacimiento, genero, telefono, correo, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) {
                System.err.println("Error: No hay conexión a la base de datos.");
                return false;
            }

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, p.getCedula());
                ps.setString(2, p.getNombres());
                
                if (p.getFechaNacimiento() != null && !p.getFechaNacimiento().trim().isEmpty()) {
                    ps.setString(3, p.getFechaNacimiento());
                } else {
                    ps.setNull(3, Types.DATE);
                }
                
                setParamOrNull(ps, 4, p.getGenero());
                setParamOrNull(ps, 5, p.getTelefono());
                setParamOrNull(ps, 6, p.getCorreo());
                setParamOrNull(ps, 7, p.getDireccion());
                
                ps.executeUpdate();
                return true;
            }
            
        } catch (SQLException e) {
            System.err.println("Error al registrar paciente: " + e.getMessage());
            return false;
        }
    }

    private void setParamOrNull(PreparedStatement ps, int index, String value) throws SQLException {
        if (value != null && !value.trim().isEmpty()) {
            ps.setString(index, value.trim());
        } else {
            ps.setNull(index, Types.VARCHAR);
        }
    }
}
