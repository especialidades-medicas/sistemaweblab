package com.laboratorio.controlador; // Mismo paquete que tu clase Conexion

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Importante: Asegúrate de tener la librería org.json en tu proyecto
import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/GuardarResultadosServlet")
public class GuardarResultadosServlet extends HttpServlet {

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

        // 2. Obtener la conexión utilizando la clase Conexion existente
        try (Connection conn = Conexion.getConnection()) {

            if (conn == null) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\", \"message\":\"No se pudo conectar a la base de datos en Railway.\"}");
                return;
            }

            JSONArray listaResultados = new JSONArray(sb.toString());

            // 3. Sentencia SQL de inserción en la tabla de especialidades_medicas
            String sql = "INSERT INTO laboratorio_resultados "
                    + "(id_orden, cod_doc, nombre_paciente, fecha_nacimiento, edad, fecha_registro, sexo, telefono, categoria, nombre_examen, resultado, unidad, valores_referencia) "
                    + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                for (int i = 0; i < listaResultados.length(); i++) {
                    JSONObject obj = listaResultados.getJSONObject(i);

                    stmt.setString(1, obj.optString("id_orden", null));
                    stmt.setString(2, obj.optString("cod_doc", null));
                    stmt.setString(3, obj.optString("nombre_paciente", null));
                    
                    String fnac = obj.optString("fecha_nacimiento", "");
                    if (!fnac.isEmpty()) {
                        stmt.setString(4, fnac);
                    } else {
                        stmt.setNull(4, java.sql.Types.DATE);
                    }

                    stmt.setString(5, obj.optString("edad", null));
                    stmt.setString(6, obj.optString("fecha_registro", null));
                    stmt.setString(7, obj.optString("sexo", null));
                    stmt.setString(8, obj.optString("telefono", null));
                    stmt.setString(9, obj.optString("categoria", "GENERAL"));
                    stmt.setString(10, obj.optString("nombre_examen", ""));
                    stmt.setString(11, obj.optString("resultado", ""));
                    stmt.setString(12, obj.optString("unidad", null));
                    stmt.setString(13, obj.optString("valores_referencia", null));

                    stmt.addBatch(); // Ejecución por lote para mayor rapidez
                }
                stmt.executeBatch();
            }

            out.print("{\"status\":\"success\", \"message\":\"Resultados guardados con éxito\"}");

        } catch (SQLException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\", \"message\":\"Error de base de datos: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\", \"message\":\"Error interno: " + e.getMessage() + "\"}");
        }
    }
}