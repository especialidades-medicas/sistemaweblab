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

@WebServlet("/ActualizarResultadoServlet")
public class ActualizarResultadoServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(ActualizarResultadoServlet.class.getName());

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String idOrden = request.getParameter("id_orden");
        String nombreExamen = request.getParameter("nombre_examen");
        String resultado = request.getParameter("resultado");
        String unidad = request.getParameter("unidad");
        String valoresReferencia = request.getParameter("valores_referencia");

        if (idOrden == null || idOrden.trim().isEmpty() || nombreExamen == null || nombreExamen.trim().isEmpty()) {
            out.print("{\"status\":\"error\", \"message\":\"id_orden y nombre_examen son obligatorios.\"}");
            return;
        }

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) {
                out.print("{\"status\":\"error\", \"message\":\"Error de conexión a la base de datos.\"}");
                return;
            }

            String sql = "UPDATE laboratorio_resultados SET resultado = ?, unidad = ?, valores_referencia = ? " +
                         "WHERE TRIM(id_orden) = ? AND TRIM(nombre_examen) = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, resultado != null ? resultado.trim() : "");
                stmt.setString(2, unidad != null ? unidad.trim() : "");
                stmt.setString(3, valoresReferencia != null ? valoresReferencia.trim() : "");
                stmt.setString(4, idOrden.trim());
                stmt.setString(5, nombreExamen.trim());

                int filasAfectadas = stmt.executeUpdate();

                if (filasAfectadas > 0) {
                    out.print("{\"status\":\"success\", \"message\":\"Resultado actualizado exitosamente.\"}");
                } else {
                    out.print("{\"status\":\"error\", \"message\":\"No se encontró el examen registrado para modificar.\"}");
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al actualizar resultado: " + e.getMessage(), e);
            out.print("{\"status\":\"error\", \"message\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}