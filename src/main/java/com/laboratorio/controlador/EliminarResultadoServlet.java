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
            out.print("{\"status\":\"error\", \"message\":\"id_orden y nombre_examen son requeridos.\"}");
            return;
        }

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) {
                out.print("{\"status\":\"error\", \"message\":\"Error de conexión a la base de datos.\"}");
                return;
            }

            String sql = "DELETE FROM laboratorio_resultados WHERE TRIM(id_orden) = ? AND TRIM(nombre_examen) = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, idOrden.trim());
                stmt.setString(2, nombreExamen.trim());
                int filasAfectadas = stmt.executeUpdate();

                if (filasAfectadas > 0) {
                    out.print("{\"status\":\"success\", \"message\":\"Examen eliminado exitosamente.\"}");
                } else {
                    out.print("{\"status\":\"error\", \"message\":\"No se encontró el examen especificado para esta orden.\"}");
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al eliminar resultado: " + e.getMessage(), e);
            out.print("{\"status\":\"error\", \"message\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}
