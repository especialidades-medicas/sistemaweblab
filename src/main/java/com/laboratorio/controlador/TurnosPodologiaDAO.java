package com.laboratorio.controlador;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class TurnosPodologiaDAO {

    private static final Logger LOGGER = Logger.getLogger(TurnosPodologiaDAO.class.getName());

    public List<TurnoPodologia> listar(String fecha) {
        List<TurnoPodologia> lista = new ArrayList<>();
        boolean filtrarPorFecha = (fecha != null && !fecha.trim().isEmpty());

        String sql;
        if (filtrarPorFecha) {
            sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, " +
                  "DATE_FORMAT(hora_inicio, '%H:%i') AS hora_inicio, duracion_minutos, creado_en " +
                  "FROM turnos_podologia WHERE fecha = ? ORDER BY hora_inicio ASC";
        } else {
            sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, " +
                  "DATE_FORMAT(hora_inicio, '%H:%i') AS hora_inicio, duracion_minutos, creado_en " +
                  "FROM turnos_podologia ORDER BY fecha DESC, hora_inicio ASC";
        }

        try (Connection con = Conexion.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            if (filtrarPorFecha) {
                ps.setString(1, fecha.trim());
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    lista.add(extraerTurno(rs));
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al listar turnos: " + e.getMessage(), e);
        }
        return lista;
    }

    public boolean guardarOActualizar(TurnoPodologia turno) {
        if (turno == null) return false;

        boolean esEdicion = turno.getId() > 0;
        String sql;

        if (esEdicion) {
            sql = "UPDATE turnos_podologia SET cedula = ?, nombres = ?, celular = ?, email = ?, " +
                  "motivo = ?, fecha = ?, hora_inicio = ?, duracion_minutos = ? WHERE id = ?";
        } else {
            sql = "INSERT INTO turnos_podologia (cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos) " +
                  "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        }

        try (Connection con = Conexion.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            setParamOrNull(ps, 1, turno.getCedula());
            setParamOrNull(ps, 2, turno.getNombres());
            setParamOrNull(ps, 3, turno.getCelular());
            setParamOrNull(ps, 4, turno.getEmail());
            setParamOrNull(ps, 5, turno.getMotivo());
            
            // Normalización para evitar fallos de sintaxis en columnas DATE y TIME de MySQL
            ps.setString(6, normalizarFecha(turno.getFecha()));
            ps.setString(7, normalizarHora(turno.getHoraInicio()));
            ps.setInt(8, turno.getDuracionMinutos() > 0 ? turno.getDuracionMinutos() : 30);

            if (esEdicion) {
                ps.setInt(9, turno.getId());
            }

            int filasAfectadas = ps.executeUpdate();
            return filasAfectadas > 0;

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al " + (esEdicion ? "actualizar" : "guardar") + " turno (ID: " + turno.getId() + "): " + e.getMessage(), e);
            return false;
        }
    }

    public boolean eliminar(int id) {
        String sql = "DELETE FROM turnos_podologia WHERE id = ?";
        try (Connection con = Conexion.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al eliminar turno: " + e.getMessage(), e);
            return false;
        }
    }

    private TurnoPodologia extraerTurno(ResultSet rs) throws SQLException {
        TurnoPodologia t = new TurnoPodologia();
        t.setId(rs.getInt("id"));
        t.setCedula(rs.getString("cedula"));
        t.setNombres(rs.getString("nombres"));
        t.setCelular(rs.getString("celular"));
        t.setEmail(rs.getString("email"));
        t.setMotivo(rs.getString("motivo"));
        
        java.sql.Date f = rs.getDate("fecha");
        t.setFecha(f != null ? f.toString() : rs.getString("fecha"));
        
        t.setHoraInicio(rs.getString("hora_inicio"));
        t.setDuracionMinutos(rs.getInt("duracion_minutos"));
        t.setCreadoEn(rs.getTimestamp("creado_en"));
        return t;
    }

    private void setParamOrNull(PreparedStatement ps, int index, String value) throws SQLException {
        if (value != null && !value.trim().isEmpty()) {
            ps.setString(index, value.trim());
        } else {
            ps.setNull(index, Types.VARCHAR);
        }
    }

    private String normalizarFecha(String fecha) {
        if (fecha == null || fecha.trim().isEmpty()) {
            return LocalDate.now().toString();
        }
        return fecha.trim();
    }

    private String normalizarHora(String hora) {
        if (hora == null || hora.trim().isEmpty()) {
            return "08:00:00";
        }
        hora = hora.trim();
        // Si viene en formato HH:mm (ej: "08:30"), lo convierte a HH:mm:ss ("08:30:00")
        if (hora.length() == 5) {
            return hora + ":00";
        }
        return hora;
    }
}
