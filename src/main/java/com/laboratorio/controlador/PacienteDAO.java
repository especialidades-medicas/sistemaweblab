package com.laboratorio.controlador;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class TurnosPodologiaDAO {

    // 1. Obtener turnos filtrados por fecha
    public List<TurnoPodologia> listarPorFecha(Date fecha) {
        List<TurnoPodologia> lista = new ArrayList<>();
        String sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos, creado_en " +
                     "FROM turnos_podologia WHERE fecha = ? ORDER BY hora_inicio ASC";

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) {
                System.err.println("Error: No hay conexión a la base de datos.");
                return lista;
            }

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setDate(1, fecha);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        TurnoPodologia turno = new TurnoPodologia();
                        turno.setId(rs.getInt("id"));
                        turno.setCedula(rs.getString("cedula"));
                        turno.setNombres(rs.getString("nombres"));
                        turno.setCelular(rs.getString("celular"));
                        turno.setEmail(rs.getString("email"));
                        turno.setMotivo(rs.getString("motivo"));
                        turno.setFecha(rs.getDate("fecha"));
                        turno.setHoraInicio(rs.getTime("hora_inicio"));
                        turno.setDuracionMinutos(rs.getInt("duracion_minutos"));
                        turno.setCreadoEn(rs.getTimestamp("creado_en"));
                        lista.add(turno);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Error al listar turnos por fecha: " + e.getMessage());
        }
        return lista;
    }

    // 2. Insertar un nuevo turno
    public boolean insertar(TurnoPodologia turno) {
        String sql = "INSERT INTO turnos_podologia (cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) return false;

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, turno.getCedula());
                ps.setString(2, turno.getNombres());
                setParamOrNull(ps, 3, turno.getCelular());
                setParamOrNull(ps, 4, turno.getEmail());
                setParamOrNull(ps, 5, turno.getMotivo());
                ps.setDate(6, turno.getFecha());
                ps.setTime(7, turno.getHoraInicio());
                ps.setInt(8, turno.getDuracionMinutos());

                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error al insertar turno: " + e.getMessage());
            return false;
        }
    }

    // 3. Actualizar turno existente
    public boolean actualizar(TurnoPodologia turno) {
        String sql = "UPDATE turnos_podologia SET cedula = ?, nombres = ?, celular = ?, email = ?, motivo = ?, fecha = ?, hora_inicio = ?, duracion_minutos = ? WHERE id = ?";

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) return false;

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setString(1, turno.getCedula());
                ps.setString(2, turno.getNombres());
                setParamOrNull(ps, 3, turno.getCelular());
                setParamOrNull(ps, 4, turno.getEmail());
                setParamOrNull(ps, 5, turno.getMotivo());
                ps.setDate(6, turno.getFecha());
                ps.setTime(7, turno.getHoraInicio());
                ps.setInt(8, turno.getDuracionMinutos());
                ps.setInt(9, turno.getId());

                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error al actualizar turno: " + e.getMessage());
            return false;
        }
    }

    // 4. Eliminar turno por ID
    public boolean eliminar(int id) {
        String sql = "DELETE FROM turnos_podologia WHERE id = ?";

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) return false;

            try (PreparedStatement ps = conn.prepareStatement(sql)) {
                ps.setInt(1, id);
                return ps.executeUpdate() > 0;
            }
        } catch (SQLException e) {
            System.err.println("Error al eliminar turno: " + e.getMessage());
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
