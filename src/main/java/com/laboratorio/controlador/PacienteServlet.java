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

@WebServlet(name = "ControladorPacientes", urlPatterns = {"/ControladorPacientes"})
public class PacienteServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(PacienteServlet.class.getName());
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        String accion = request.getParameter("accion");
        
        try {
            // 1. BUSCAR PACIENTE POR CÉDULA
            if ("buscar".equals(accion)) {
                String cedula = request.getParameter("cedula");
                String sql = "SELECT * FROM pacientes WHERE cedula = ?";
                
                try (Connection con = Conexion.getConnection();
                     PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setString(1, cedula);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) {
                            Paciente p = extraerPaciente(rs);
                            response.getWriter().write(gson.toJson(p));
                        } else {
                            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                            response.getWriter().write("{\"error\": \"Paciente no encontrado\"}");
                        }
                    }
                }
                return;
            }
            
            // 2. LISTAR TODOS LOS PACIENTES (Para la tabla)
            List<Paciente> lista = new ArrayList<>();
            String sql = "SELECT * FROM pacientes";
            
            try (Connection con = Conexion.getConnection();
                 PreparedStatement ps = con.prepareStatement(sql);
                 ResultSet rs = ps.executeQuery()) {
                
                while (rs.next()) {
                    lista.add(extraerPaciente(rs));
                }
            }
            
            response.getWriter().write(gson.toJson(lista));

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error en doGet: ControladorPacientes", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("[]");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        
        String accion = request.getParameter("accion");

        // ACCIÓN DE ELIMINAR PACIENTE
        if ("eliminar".equals(accion)) {
            String cedulaEliminar = request.getParameter("cedula");
            if (cedulaEliminar == null || cedulaEliminar.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\": \"La cédula es obligatoria para eliminar.\"}");
                return;
            }

            String sqlDelete = "DELETE FROM pacientes WHERE cedula = ?";
            try (Connection con = Conexion.getConnection();
                 PreparedStatement ps = con.prepareStatement(sqlDelete)) {
                ps.setString(1, cedulaEliminar.trim());
                int filasAfectadas = ps.executeUpdate();
                
                if (filasAfectadas > 0) {
                    response.getWriter().write("{\"status\": \"OK\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("{\"error\": \"Paciente no encontrado para eliminar.\"}");
                }
            } catch (SQLException e) {
                LOGGER.log(Level.SEVERE, "Error al eliminar paciente", e);
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"Error al eliminar: " + e.getMessage() + "\"}");
            }
            return;
        }

        String cedula = request.getParameter("patCedula");
        String nombres = request.getParameter("patNombre");

        // Validación estricta para Guardar o Actualizar
        if (cedula == null || cedula.trim().isEmpty() || nombres == null || nombres.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"La cédula y los nombres son obligatorios.\"}");
            return;
        }

        String fechaNacimiento = request.getParameter("patNacimiento");
        String genero = request.getParameter("patGenero");
        String telefono = request.getParameter("patTelefono");
        String correo = request.getParameter("patCorreo");
        String direccion = request.getParameter("patDireccion");

        try (Connection con = Conexion.getConnection()) {
            String sql = "INSERT INTO pacientes (cedula, nombres, fecha_nacimiento, genero, telefono, correo, direccion) " +
                         "VALUES (?, ?, ?, ?, ?, ?, ?) " +
                         "ON DUPLICATE KEY UPDATE " +
                         "nombres = VALUES(nombres), " +
                         "fecha_nacimiento = VALUES(fecha_nacimiento), " +
                         "genero = VALUES(genero), " +
                         "telefono = VALUES(telefono), " +
                         "correo = VALUES(correo), " +
                         "direccion = VALUES(direccion)";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setString(1, cedula.trim());
                ps.setString(2, nombres.trim());
                
                if (fechaNacimiento != null && !fechaNacimiento.trim().isEmpty() && !fechaNacimiento.contains("11111")) {
                    ps.setString(3, fechaNacimiento.trim());
                } else {
                    ps.setNull(3, Types.DATE);
                }
                
                setParamOrNull(ps, 4, genero);
                setParamOrNull(ps, 5, telefono);
                setParamOrNull(ps, 6, correo);
                setParamOrNull(ps, 7, direccion);
                
                ps.executeUpdate();
                response.getWriter().write("{\"status\": \"OK\"}");
            }
            
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al procesar paciente", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al procesar: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Método auxiliar para extraer un objeto Paciente desde el ResultSet de manera limpia.
     */
    private Paciente extraerPaciente(ResultSet rs) throws SQLException {
        Paciente p = new Paciente();
        p.setIdPaciente(rs.getInt("id_paciente"));
        p.setCedula(rs.getString("cedula"));
        p.setNombres(rs.getString("nombres"));
        p.setFechaNacimiento(rs.getString("fecha_nacimiento"));
        p.setGenero(rs.getString("genero"));
        p.setTelefono(rs.getString("telefono"));
        p.setCorreo(rs.getString("correo"));
        p.setDireccion(rs.getString("direccion"));
        return p;
    }

    /**
     * Método auxiliar para manejar parámetros nulos o vacíos en el PreparedStatement.
     */
    private void setParamOrNull(PreparedStatement ps, int index, String value) throws SQLException {
        if (value != null && !value.trim().isEmpty()) {
            ps.setString(index, value.trim());
        } else {
            ps.setNull(index, Types.VARCHAR);
        }
    }
}