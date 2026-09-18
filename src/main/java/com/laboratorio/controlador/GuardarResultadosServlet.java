package com.laboratorio.controlador;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Types;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;

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

        String body = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));
        
        if (body == null || body.trim().isEmpty()) {
            out.print("{\"status\":\"error\", \"message\":\"No se recibieron datos.\"}");
            return;
        }

        JSONArray array = new JSONArray(body);
        if (array.length() == 0) {
            out.print("{\"status\":\"error\", \"message\":\"Lista de datos vacía.\"}");
            return;
        }

        JSONObject primerRegistro = array.getJSONObject(0);
        String idOrden = primerRegistro.optString("id_orden", "").trim();

        if (idOrden.isEmpty()) {
            out.print("{\"status\":\"error\", \"message\":\"El id_orden es requerido.\"}");
            return;
        }

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) {
                out.print("{\"status\":\"error\", \"message\":\"Error de conexión a la base de datos.\"}");
                return;
            }

            conn.setAutoCommit(false); // Iniciar transacción

            // 1. Extraer nombres de exámenes que conservan resultado
            List<String> examenesConservar = new ArrayList<>();
            for (int i = 0; i < array.length(); i++) {
                JSONObject obj = array.getJSONObject(i);
                String exName = obj.optString("nombre_examen", "").trim();
                if (!exName.isEmpty() && !obj.optBoolean("eliminar_todos", false)) {
                    examenesConservar.add(exName);
                }
            }

            // 2. Limpiar registros eliminados
            if (!examenesConservar.isEmpty()) {
                StringBuilder sqlDelete = new StringBuilder(
                    "DELETE FROM laboratorio_resultados WHERE TRIM(id_orden) = ? AND TRIM(nombre_examen) NOT IN ("
                );
                for (int i = 0; i < examenesConservar.size(); i++) {
                    sqlDelete.append(i == 0 ? "?" : ", ?");
                }
                sqlDelete.append(")");

                try (PreparedStatement stmtDelete = conn.prepareStatement(sqlDelete.toString())) {
                    stmtDelete.setString(1, idOrden);
                    for (int i = 0; i < examenesConservar.size(); i++) {
                        stmtDelete.setString(i + 2, examenesConservar.get(i));
                    }
                    stmtDelete.executeUpdate();
                }
            } else {
                String sqlDeleteAll = "DELETE FROM laboratorio_resultados WHERE TRIM(id_orden) = ?";
                try (PreparedStatement stmtDelete = conn.prepareStatement(sqlDeleteAll)) {
                    stmtDelete.setString(1, idOrden);
                    stmtDelete.executeUpdate();
                }
            }

            // 3. Insertar o actualizar resultados válidos
            boolean hayExamenesValidos = primerRegistro.has("nombre_examen") && !primerRegistro.optBoolean("eliminar_todos", false);
            
            if (hayExamenesValidos) {
                String sqlUpsert = "INSERT INTO laboratorio_resultados " +
                    "(id_orden, cod_doc, nombre_paciente, fecha_nacimiento, edad, fecha_registro, sexo, telefono, categoria, nombre_examen, resultado, unidad, valores_referencia) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE " +
                    "cod_doc = VALUES(cod_doc), nombre_paciente = VALUES(nombre_paciente), fecha_nacimiento = VALUES(fecha_nacimiento), " +
                    "edad = VALUES(edad), fecha_registro = VALUES(fecha_registro), sexo = VALUES(sexo), telefono = VALUES(telefono), " +
                    "categoria = VALUES(categoria), resultado = VALUES(resultado), unidad = VALUES(unidad), valores_referencia = VALUES(valores_referencia)";

                try (PreparedStatement stmtUpsert = conn.prepareStatement(sqlUpsert)) {
                    for (int i = 0; i < array.length(); i++) {
                        JSONObject obj = array.getJSONObject(i);
                        if (obj.optBoolean("eliminar_todos", false)) continue;

                        stmtUpsert.setString(1, idOrden);
                        stmtUpsert.setString(2, obj.optString("cod_doc", ""));
                        stmtUpsert.setString(3, obj.optString("nombre_paciente", ""));
                        
                        // Asignación segura de fechas (NULL si vienen vacías)
                        setParametroFecha(stmtUpsert, 4, obj.optString("fecha_nacimiento", ""));
                        stmtUpsert.setString(5, obj.optString("edad", ""));
                        setParametroFecha(stmtUpsert, 6, obj.optString("fecha_registro", ""));

                        stmtUpsert.setString(7, obj.optString("sexo", ""));
                        stmtUpsert.setString(8, obj.optString("telefono", ""));
                        stmtUpsert.setString(9, obj.optString("categoria", ""));
                        stmtUpsert.setString(10, obj.optString("nombre_examen", "").trim());
                        stmtUpsert.setString(11, obj.optString("resultado", ""));
                        stmtUpsert.setString(12, obj.optString("unidad", ""));
                        stmtUpsert.setString(13, obj.optString("valores_referencia", ""));
                        stmtUpsert.addBatch();
                    }
                    stmtUpsert.executeBatch();
                }
            }

            conn.commit();
            out.print("{\"status\":\"success\", \"message\":\"Resultados guardados y sincronizados correctamente.\"}");

        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al sincronizar resultados: " + e.getMessage(), e);
            out.print("{\"status\":\"error\", \"message\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }

    /**
     * Setea una fecha válida o NULL para evitar 'Data truncation: Incorrect date value'
     */
    private void setParametroFecha(PreparedStatement stmt, int index, String fechaStr) throws SQLException {
        if (fechaStr == null || fechaStr.trim().isEmpty()) {
            stmt.setNull(index, Types.DATE);
        } else {
            stmt.setString(index, fechaStr.trim());
        }
    }
}
