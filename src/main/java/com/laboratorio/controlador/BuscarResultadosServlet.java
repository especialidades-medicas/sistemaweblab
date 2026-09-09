package com.laboratorio.controlador;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/GuardarResultadoServlet")
public class GuardarResultadoServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(GuardarResultadoServlet.class.getName());

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        // 1. Recepción de los 13 campos + identificador de edición
        String idOrden = request.getParameter("id_orden");
        String codDoc = request.getParameter("cod_doc");
        String nombrePaciente = request.getParameter("nombre_paciente");
        String fechaNacimiento = request.getParameter("fecha_nacimiento");
        String edad = request.getParameter("edad");
        String fechaRegistro = request.getParameter("fecha_registro");
        String sexo = request.getParameter("sexo");
        String telefono = request.getParameter("telefono");
        String categoria = request.getParameter("categoria");
        String nombreExamen = request.getParameter("nombre_examen");
        String nombreExamenOriginal = request.getParameter("nombre_examen_original");
        String resultado = request.getParameter("resultado");
        String unidad = request.getParameter("unidad");
        String valoresRef = request.getParameter("valores_referencia");

        if (idOrden == null || idOrden.trim().isEmpty() || nombreExamen == null || nombreExamen.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"status\":\"error\", \"message\":\"id_orden y nombre_examen son requeridos.\"}");
            return;
        }

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\", \"message\":\"Error de conexión a la BD.\"}");
                return;
            }

            String claveExamen = (nombreExamenOriginal != null && !nombreExamenOriginal.trim().isEmpty()) 
                                 ? nombreExamenOriginal : nombreExamen;

            // Verificar si el examen ya existe para este N° de orden
            String checkSql = "SELECT COUNT(*) FROM laboratorio_resultados WHERE id_orden = ? AND nombre_examen = ?";
            boolean existe = false;
            try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                checkStmt.setString(1, idOrden);
                checkStmt.setString(2, claveExamen);
                ResultSet rs = checkStmt.executeQuery();
                if (rs.next() && rs.getInt(1) > 0) {
                    existe = true;
                }
            }

            if (existe) {
                // Actualización del resultado
                String updateSql = "UPDATE laboratorio_resultados SET categoria = ?, nombre_examen = ?, resultado = ?, unidad = ?, valores_referencia = ? "
                                 + "WHERE id_orden = ? AND nombre_examen = ?";
                try (PreparedStatement stmt = conn.prepareStatement(updateSql)) {
                    stmt.setString(1, categoria != null ? categoria : "");
                    stmt.setString(2, nombreExamen);
                    stmt.setString(3, resultado != null ? resultado : "");
                    stmt.setString(4, unidad != null ? unidad : "");
                    stmt.setString(5, valoresRef != null ? valoresRef : "");
                    stmt.setString(6, idOrden);
                    stmt.setString(7, claveExamen);
                    stmt.executeUpdate();
                }
            } else {
                // Inserción de un nuevo examen conservando datos del paciente
                String insertSql = "INSERT INTO laboratorio_resultados "
                                 + "(id_orden, cod_doc, nombre_paciente, fecha_nacimiento, edad, fecha_registro, sexo, telefono, categoria, nombre_examen, resultado, unidad, valores_referencia) "
                                 + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                try (PreparedStatement stmt = conn.prepareStatement(insertSql)) {
                    stmt.setString(1, idOrden);
                    stmt.setString(2, codDoc != null ? codDoc : "");
                    stmt.setString(3, nombrePaciente != null ? nombrePaciente : "");
                    stmt.setString(4, fechaNacimiento != null ? fechaNacimiento : "");
                    stmt.setString(5, edad != null ? edad : "");
                    stmt.setString(6, fechaRegistro != null ? fechaRegistro : "");
                    stmt.setString(7, sexo != null ? sexo : "");
                    stmt.setString(8, telefono != null ? telefono : "");
                    stmt.setString(9, categoria != null ? categoria : "");
                    stmt.setString(10, nombreExamen);
                    stmt.setString(11, resultado != null ? resultado : "");
                    stmt.setString(12, unidad != null ? unidad : "");
                    stmt.setString(13, valoresRef != null ? valoresRef : "");
                    stmt.executeUpdate();
                }
            }

            out.print("{\"status\":\"success\", \"message\":\"Resultado guardado exitosamente.\"}");
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al guardar resultado: " + e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\", \"message\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}
}
