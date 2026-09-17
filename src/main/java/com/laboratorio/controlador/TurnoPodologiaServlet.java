package com.laboratorio.controlador;

import com.google.gson.Gson;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "ControladorTurnos", urlPatterns = {"/ControladorTurnos"})
public class TurnoPodologiaServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(TurnoPodologiaServlet.class.getName());
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        String accion = request.getParameter("accion");
        String fecha = request.getParameter("fecha");

        try (Connection con = Conexion.getConnection()) {
            if (con == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"No se pudo conectar a la base de datos.\"}");
                return;
            }

            // 1. LISTAR TURNOS POR FECHA O TODOS
            List<TurnoPodologia> lista = new ArrayList<>();
            String sql = (fecha != null && !fecha.trim().isEmpty()) 
                         ? "SELECT * FROM turnos_podologia WHERE fecha = ? ORDER BY hora_inicio ASC"
                         : "SELECT * FROM turnos_podologia ORDER BY fecha DESC, hora_inicio ASC";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                if (fecha != null && !fecha.trim().isEmpty()) {
                    ps.setString(1, fecha.trim());
                }
                
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        lista.add(extraerTurno(rs));
                    }
                }
            }

            response.getWriter().write(gson.toJson(lista));

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error en doGet: ControladorTurnos", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error en el servidor: " + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        String accion = request.getParameter("accion");

        try (Connection con = Conexion.getConnection()) {
            if (con == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"No se pudo conectar a la base de datos.\"}");
                return;
            }

            // 2. ELIMINAR TURNO POR ID
            if ("eliminar".equals(accion)) {
                String idStr = request.getParameter("id");
                if (idStr == null || idStr.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("{\"error\": \"El ID es requerido para eliminar.\"}");
                    return;
                }

                String sqlDelete = "DELETE FROM turnos_podologia WHERE id = ?";
                try (PreparedStatement ps = con.prepareStatement(sqlDelete)) {
                    ps.setInt(1, Integer.parseInt(idStr.trim()));
                    int filasAfectadas = ps.executeUpdate();

                    if (filasAfectadas > 0) {
                        response.getWriter().write("{\"status\": \"OK\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        response.getWriter().write("{\"error\": \"Turno no encontrado.\"}");
                    }
                }
                return;
            }

            // 3. GUARDAR / REGISTRAR TURNO
            String cedula = request.getParameter("cedula");
            String nombres = request.getParameter("nombres");
            String fecha = request.getParameter("fecha");
            String horaInicio = request.getParameter("hora_inicio");

            if (cedula == null || cedula.trim().isEmpty() || nombres == null || nombres.trim().isEmpty() || fecha == null || horaInicio == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\": \"Cédula, Nombres, Fecha y Hora de inicio son obligatorios.\"}");
                return;
            }

            String celular = request.getParameter("celular");
            String email = request.getParameter("email");
            String motivo = request.getParameter("motivo");
            String duracionStr = request.getParameter("duracion_minutos");
            int duracion = (duracionStr != null && !duracionStr.trim().isEmpty()) ? Integer.parseInt(duracionStr.trim()) : 30;

            String sql = "INSERT INTO turnos_podologia (cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos) " +
                         "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setString(1, cedula.trim());
                ps.setString(2, nombres.trim());
                setParamOrNull(ps, 3, celular);
                setParamOrNull(ps, 4, email);
                setParamOrNull(ps, 5, motivo);
                ps.setString(6, fecha.trim());
                ps.setString(7, horaInicio.trim());
                ps.setInt(8, duracion);

                ps.executeUpdate();
                response.getWriter().write("{\"status\": \"OK\"}");
            }

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error en doPost: ControladorTurnos", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al procesar la solicitud: " + e.getMessage() + "\"}");
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
        t.setFecha(rs.getString("fecha"));
        t.setHoraInicio(rs.getString("hora_inicio"));
        t.setDuracionMinutos(rs.getInt("duracion_minutos"));
        t.setCreadoEn(rs.getString("creado_en"));
        return t;
    }

    private void setParamOrNull(PreparedStatement ps, int index, String value) throws SQLException {
        if (value != null && !value.trim().isEmpty()) {
            ps.setString(index, value.trim());
        } else {
            ps.setNull(index, Types.VARCHAR);
        }
    }
}