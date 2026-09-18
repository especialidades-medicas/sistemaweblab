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

import org.json.JSONArray;
import org.json.JSONObject;

@WebServlet("/BuscarResultadosServlet")
public class BuscarResultadosServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(BuscarResultadosServlet.class.getName());

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String idOrden = request.getParameter("id_orden");

        if (idOrden == null || idOrden.trim().isEmpty()) {
            out.print("{\"status\":\"error\", \"message\":\"El id_orden es requerido.\"}");
            return;
        }

        try (Connection conn = Conexion.getConnection()) {
            if (conn == null) {
                out.print("{\"status\":\"error\", \"message\":\"Error de conexión a la base de datos.\"}");
                return;
            }

            String sql = "SELECT * FROM laboratorio_resultados WHERE TRIM(id_orden) = ?";
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                stmt.setString(1, idOrden.trim());
                ResultSet rs = stmt.executeQuery();

                JSONArray resultados = new JSONArray();
                while (rs.next()) {
                    JSONObject item = new JSONObject();
                    item.put("id_orden", opt(rs.getString("id_orden")));
                    item.put("cod_doc", opt(rs.getString("cod_doc")));
                    item.put("nombre_paciente", opt(rs.getString("nombre_paciente")));
                    item.put("fecha_nacimiento", opt(rs.getString("fecha_nacimiento")));
                    item.put("edad", opt(rs.getString("edad")));
                    item.put("fecha_registro", opt(rs.getString("fecha_registro")));
                    item.put("sexo", opt(rs.getString("sexo")));
                    item.put("telefono", opt(rs.getString("telefono")));
                    item.put("categoria", opt(rs.getString("categoria")));
                    item.put("nombre_examen", opt(rs.getString("nombre_examen")));
                    item.put("resultado", opt(rs.getString("resultado")));
                    item.put("unidad", opt(rs.getString("unidad")));
                    item.put("valores_referencia", opt(rs.getString("valores_referencia")));

                    resultados.put(item);
                }

                out.print(resultados.toString());
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error al buscar orden: " + e.getMessage(), e);
            out.print("{\"status\":\"error\", \"message\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }

    private String opt(String val) {
        return val != null ? val : "";
    }
}
