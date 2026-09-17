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
        String fecha = request.getParameter("fecha");

        try (Connection con = Conexion.getConnection()) {
            if (con == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"No se pudo establecer conexión con la base de datos.\"}");
                return;
            }

            List<TurnoPodologia> lista = new ArrayList<>();
            String sql;

            if (fecha != null && !fecha.trim().isEmpty()) {
                sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, " +
                      "DATE_FORMAT(hora_inicio, '%H:%i') AS hora_inicio, duracion_minutos, creado_en " +
                      "FROM turnos_podologia WHERE fecha = ? ORDER BY hora_inicio ASC";
            } else {
                sql = "SELECT id, cedula, nombres, celular, email, motivo, fecha, " +
                      "DATE_FORMAT(hora_inicio, '%H:%i') AS hora_inicio, duracion_minutos, creado_en " +
                      "FROM turnos_podologia ORDER BY fecha DESC, hora_inicio ASC";
            }

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
            response.getWriter().write("{\"error\": \"Error interno en el servidor: " + e.getMessage() + "\"}");
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

            // 1. ELIMINAR TURNO
            if ("eliminar".equals(accion)) {
                String idEliminar = request.getParameter("id");
                if (idEliminar == null || idEliminar.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("{\"error\": \"El ID es obligatorio para eliminar.\"}");
                    return;
                }

                String sqlDelete = "DELETE FROM turnos_podologia WHERE id = ?";
                try (PreparedStatement ps = con.prepareStatement(sqlDelete)) {
                    ps.setInt(1, Integer.parseInt(idEliminar.trim()));
                    int filasAfectadas = ps.executeUpdate();
                    
                    if (filasAfectadas > 0) {
                        response.getWriter().write("{\"status\": \"OK\"}");
                    } else {
                        response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        response.getWriter().write("{\"error\": \"Turno no encontrado para eliminar.\"}");
                    }
                }
                return;
            }

            // 2. GUARDAR O ACTUALIZAR TURNO
            String idStr = request.getParameter("id");
            String cedula = obtenerParametro(request, "turnCedula", "cedula");
            String nombres = obtenerParametro(request, "turnNombres", "nombres");
            String celular = obtenerParametro(request, "turnCelular", "celular");
            String email = obtenerParametro(request, "turnEmail", "email");
            String motivo = obtenerParametro(request, "turnMotivo", "motivo");
            String fecha = request.getParameter("fecha");
            String horaInicio = request.getParameter("horaInicio");
            String duracionStr = request.getParameter("duracionMinutos");

            if (fecha == null || fecha.trim().isEmpty() || horaInicio == null || horaInicio.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\": \"La fecha y la hora de inicio son obligatorias.\"}");
                return;
            }

            int duracionMinutos = 30;
            if (duracionStr != null && !duracionStr.trim().isEmpty()) {
                try {
                    duracionMinutos = Integer.parseInt(duracionStr.trim());
                } catch (NumberFormatException ignored) {}
            }

            boolean esEdicion = idStr != null && !idStr.trim().isEmpty() && !idStr.equals("0");
            String sql;

            if (esEdicion) {
                sql = "UPDATE turnos_podologia SET cedula = ?, nombres = ?, celular = ?, email = ?, " +
                      "motivo = ?, fecha = ?, hora_inicio = ?, duracion_minutos = ? WHERE id = ?";
            } else {
                sql = "INSERT INTO turnos_podologia (cedula, nombres, celular, email, motivo, fecha, hora_inicio, duracion_minutos) " +
                      "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            }

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                setParamOrNull(ps, 1, cedula);
                setParamOrNull(ps, 2, nombres);
                setParamOrNull(ps, 3, celular);
                setParamOrNull(ps, 4, email);
                setParamOrNull(ps, 5, motivo);
                ps.setString(6, fecha.trim());
                ps.setString(7, horaInicio.trim());
                ps.setInt(8, duracionMinutos);

                if (esEdicion) {
                    ps.setInt(9, Integer.parseInt(idStr.trim()));
                }

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

    private String obtenerParametro(HttpServletRequest request, String clavePrincipal, String claveAlternativa) {
        String valor = request.getParameter(clavePrincipal);
        if (valor == null || valor.trim().isEmpty()) {
            valor = request.getParameter(claveAlternativa);
        }
        return valor;
    }
}
