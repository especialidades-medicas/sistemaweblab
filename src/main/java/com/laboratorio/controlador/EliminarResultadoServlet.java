package com.laboratorio.controlador;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/EliminarResultadoServlet")
public class EliminarResultadoServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(EliminarResultadoServlet.class.getName());

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String idOrden = request.getParameter("id_orden");
        String nombreExamen = request.getParameter("nombre_examen");

        if (idOrden == null || idOrden.trim().isEmpty() || nombreExamen == null || nombreExamen.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\", \"message\":\"id_orden y nombre_examen son requeridos para eliminar.\"}");
            return;
        }

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\", \"message\":\"Error de conexión a la BD.\"}");
                return;
            }

            String sql = "DELETE FROM laboratorio_resultados WHERE id_orden = ? AND nombre_examen = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, idOrden);
                stmt.setString(2, nombreExamen);
                int filasAfectadas = stmt.executeUpdate();

                if (filasAfectadas > 0) {
                    out.print("{\"status\":\"success\", \"message\":\"Examen eliminado exitosamente de la base de datos.\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"status\":\"error\", \"message\":\"No se encontró el examen especificado para esta orden.\"}");
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al eliminar resultado: " + e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\", \"message\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}
