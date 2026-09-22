package com.laboratorio.controlador;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class TurnosFisioterapiaDAO {

    private static final Logger LOGGER = Logger.getLogger(TurnosFisioterapiaDAO.class.getName());

    public List<TurnoFisioterapia> listar(String fecha) {
        List<TurnoFisioterapia> lista = new ArrayList<>();
        boolean filtrarPorFecha = (fecha != null && !fecha.trim().isEmpty());

        String sql;
        if (filtrarPorFecha) {
            sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, " +
                  "DATE_FORMAT(hora_inicio, '%H:%i') AS hora_inicio, duracion_minutos, creado_en " +
                  "FROM turnos_fisioterapia WHERE fecha = ? ORDER BY hora_inicio ASC";
        } else {
            sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, " +
                  "DATE_FORMAT(hora_inicio, '%H:%i') AS hora_inicio, duracion_minutos, creado_en " +
                  "FROM turnos_fisioterapia ORDER BY fecha DESC, hora_inicio ASC";
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

    public boolean guardarOActualizar(TurnoFisioterapia turno) {
        if (turno == null) return false;

        boolean esEdicion = turno.getId() > 0;
        String sql;

        if (esEdicion) {
            sql = "UPDATE turnos_fisioterapia SET cedula = ?, nombres = ?, celular = ?, email = ?, " +
                  "motivo = ?, fecha = ?, hora_inicio = ?, duracion_minutos = ? WHERE id = ?";
        } else {
            sql = "INSERT INTO turnos_fisioterapia (cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos) " +
                  "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        }

        try (Connection con = Conexion.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            setParamOrNull(ps, 1, turno.getCedula());
            setParamOrNull(ps, 2, turno.getNombres());
            setParamOrNull(ps, 3, turno.getCelular());
            setParamOrNull(ps, 4, turno.getEmail());
            setParamOrNull(ps, 5, turno.getMotivo());
            
            // Validación estricta de fecha y hora
            ps.setString(6, normalizarFecha(turno.getFecha()));
            ps.setString(7, normalizarHora(turno.getHoraInicio()));
            ps.setInt(8, turno.getDuracionMinutos() > 0 ? turno.getDuracionMinutos() : 50);

            if (esEdicion) {
                ps.setInt(9, turno.getId());
            }

            int filasAfectadas = ps.executeUpdate();
            
            if (filasAfectadas == 0) {
                LOGGER.log(Level.WARNING, "No se realizó ninguna acción en la BD para el ID {0}", turno.getId());
            }

            return filasAfectadas > 0;

        } catch (SQLException | IllegalArgumentException e) {
            LOGGER.log(Level.SEVERE, "Error al " + (esEdicion ? "actualizar" : "guardar") + " turno (ID: " + turno.getId() + "): " + e.getMessage(), e);
            return false;
        }
    }

    public boolean eliminar(int id) {
        String sql = "DELETE FROM turnos_fisioterapia WHERE id = ?";
        try (Connection con = Conexion.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            return ps.executeUpdate() > 0;

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al eliminar turno: " + e.getMessage(), e);
            return false;
        }
    }

    private TurnoFisioterapia extraerTurno(ResultSet rs) throws SQLException {
        TurnoFisioterapia t = new TurnoFisioterapia();
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
            throw new IllegalArgumentException("La fecha es obligatoria y no fue enviada.");
        }
        
        fecha = fecha.trim();
        
        // Si la fecha viene en formato DD/MM/YYYY, se convierte a YYYY-MM-DD
        if (fecha.contains("/")) {
            String[] partes = fecha.split("/");
            if (partes.length == 3) {
                if (partes[0].length() == 4) {
                    return partes[0] + "-" + String.format("%02d", Integer.parseInt(partes[1])) + "-" + String.format("%02d", Integer.parseInt(partes[2]));
                } else {
                    return partes[2] + "-" + String.format("%02d", Integer.parseInt(partes[1])) + "-" + String.format("%02d", Integer.parseInt(partes[0]));
                }
            }
        }
        
        return fecha;
    }

    private String normalizarHora(String hora) {
        if (hora == null || hora.trim().isEmpty()) {
            throw new IllegalArgumentException("La hora de inicio es obligatoria y no fue enviada.");
        }
        
        hora = hora.trim();
        
        // Si viene en formato HH:mm (ej: 08:00), se ajusta a HH:mm:ss para MySQL
        if (hora.length() == 5) {
            return hora + ":00";
        }
        return hora;
    }
}
