package com.laboratorio.controlador;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class TurnosPodologiaDAO {
    private static final Logger LOGGER = Logger.getLogger(TurnosPodologiaDAO.class.getName());

    public List<TurnoPodologia> listarPorFecha(Date fecha) {
        List<TurnoPodologia> lista = new ArrayList<>();
        String sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos, creado_en " +
                     "FROM turnos_podologia WHERE fecha = ? ORDER BY hora_inicio ASC";

        try (Connection con = Conexion.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setDate(1, fecha);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    TurnoPodologia t = new TurnoPodologia();
                    t.setId(rs.getInt("id"));
                    t.setCedula(rs.getString("cedula"));
                    t.setNombres(rs.getString("nombres"));
                    t.setCelular(rs.getString("celular"));
                    t.setEmail(rs.getString("email"));
                    t.setMotivo(rs.getString("motivo"));
                    t.setFecha(rs.getDate("fecha"));
                    t.setHoraInicio(rs.getTime("hora_inicio"));
                    t.setDuracionMinutos(rs.getInt("duracion_minutos"));
                    t.setCreadoEn(rs.getTimestamp("creado_en"));
                    lista.add(t);
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al listar turnos: " + e.getMessage(), e);
        }
        return lista;
    }

    public boolean insertar(TurnoPodologia turno) {
        String sql = "INSERT INTO turnos_podologia (cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = Conexion.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, turno.getCedula());
            ps.setString(2, turno.getNombres());
            ps.setString(3, turno.getCelular());
            ps.setString(4, turno.getEmail());
            ps.setString(5, turno.getMotivo());
            ps.setDate(6, turno.getFecha());
            ps.setTime(7, turno.getHoraInicio());
            ps.setInt(8, turno.getDuracionMinutos());

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al insertar turno: " + e.getMessage(), e);
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
}
