package com.laboratorio.dao;

import com.laboratorio.controlador.Conexion;
import com.laboratorio.modelo.TurnoPodologia;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

public class TurnosPodologiaDAO {
    private static final Logger LOGGER = Logger.getLogger(TurnosPodologiaDAO.class.getName());

    // Obtener todos los turnos
    public List<TurnoPodologia> listar() {
        List<TurnoPodologia> lista = new ArrayList<>();
        String sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos, creado_en FROM turnos_podologia";

        try (Connection con = Conexion.getConnection();
             PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

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
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al listar turnos de podología: " + e.getMessage(), e);
        }
        return lista;
    }

    // Insertar un nuevo turno
    public boolean insertar(TurnoPodologia turno) {
        String sql = "INSERT INTO turnos_podologia (cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

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
            LOGGER.log(Level.SEVERE, "Error al insertar turno de podología: " + e.getMessage(), e);
            return false;
        }
    }
}