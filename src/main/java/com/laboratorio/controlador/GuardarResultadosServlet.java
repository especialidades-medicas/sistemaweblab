package com.laboratorio.controlador;

import java.io.BufferedReader;
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

import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/GuardarResultadosServlet")
public class GuardarResultadosServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(GuardarResultadosServlet.class.getName());

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        // 1. Leer el JSON enviado desde el Frontend
        StringBuilder sb = new StringBuilder();
        String line;
        try (BufferedReader reader = request.getReader()) {
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }

        // 2. Conexión a la Base de Datos
        try (Connection conn = Conexion.getConnection()) {

            if (conn == null) {
                LOGGER.log(Level.SEVERE, "No se pudo establecer conexión con la BD en Railway.");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\", \"message\":\"No se pudo conectar a la base de datos.\"}");
                return;
            }

            JSONArray listaResultados = new JSONArray(sb.toString());

            if (listaResultados.length() > 0) {
                // 3. Eliminar registros previos de esta orden (permite actualizar sin duplicar)
                String idOrdenActual = listaResultados.getJSONObject(0).optString("id_orden", "");
                if (!idOrdenActual.trim().isEmpty()) {
                    String deleteSql = "DELETE FROM laboratorio_resultados WHERE id_orden = ?";
                    try (PreparedStatement stmtDelete = conn.prepareStatement(deleteSql)) {
                        stmtDelete.setString(1, idOrdenActual);
                        stmtDelete.executeUpdate();
                    }
                }

                // 4. Inserción en lote (Batch Insert)
                String insertSql = "INSERT INTO laboratorio_resultados "
                        + "(id_orden, cod_doc, nombre_paciente, fecha_nacimiento, edad, fecha_registro, sexo, telefono, categoria, nombre_examen, resultado, unidad, valores_referencia) "
                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement stmtInsert = conn.prepareStatement(insertSql)) {
                    for (int i = 0; i < listaResultados.length(); i++) {
                        JSONObject obj = listaResultados.getJSONObject(i);

                        stmtInsert.setString(1, obj.optString("id_orden", null));
                        stmtInsert.setString(2, obj.optString("cod_doc", null));
                        stmtInsert.setString(3, obj.optString("nombre_paciente", null));
                        
                        String fnac = obj.optString("fecha_nacimiento", "");
                        if (!fnac.isEmpty()) {
                            stmtInsert.setString(4, fnac);
                        } else {
                            stmtInsert.setNull(4, java.sql.Types.DATE);
                        }

                        stmtInsert.setString(5, obj.optString("edad", null));
                        stmtInsert.setString(6, obj.optString("fecha_registro", null));
                        stmtInsert.setString(7, obj.optString("sexo", null));
                        stmtInsert.setString(8, obj.optString("telefono", null));
                        stmtInsert.setString(9, obj.optString("categoria", "GENERAL"));
                        stmtInsert.setString(10, obj.optString("nombre_examen", ""));
                        stmtInsert.setString(11, obj.optString("resultado", ""));
                        stmtInsert.setString(12, obj.optString("unidad", null));
                        stmtInsert.setString(13, obj.optString("valores_referencia", null));

                        stmtInsert.addBatch();
                    }
                    stmtInsert.executeBatch();
                }
            }

            out.print("{\"status\":\"success\", \"message\":\"Resultados guardados o actualizados con éxito\"}");

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error SQL en GuardarResultadosServlet: " + e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\", \"message\":\"Error de base de datos: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error interno en GuardarResultadosServlet: " + e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\", \"message\":\"Error interno: " + e.getMessage() + "\"}");
        }
    }
}
