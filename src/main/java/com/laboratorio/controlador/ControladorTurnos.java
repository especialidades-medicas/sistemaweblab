package com.laboratorio.controlador;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Date;
import java.sql.Time;
import java.util.List;

@WebServlet("/ControladorTurnos")
public class ControladorTurnos extends HttpServlet {

    private final TurnosPodologiaDAO dao = new TurnosPodologiaDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        response.setContentType("application/json; charset=UTF-8");
        PrintWriter out = response.getWriter();

        String fechaStr = request.getParameter("fecha");
        Date fecha = (fechaStr != null && !fechaStr.isEmpty()) ? Date.valueOf(fechaStr) : new Date(System.currentTimeMillis());

        List<TurnoPodologia> lista = dao.listarPorFecha(fecha);

        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < lista.size(); i++) {
            TurnoPodologia t = lista.get(i);
            json.append(String.format(
                "{\"id\":%d, \"cedula\":\"%s\", \"nombres\":\"%s\", \"celular\":\"%s\", \"email\":\"%s\", \"motivo\":\"%s\", \"fecha\":\"%s\", \"hora_inicio\":\"%s\", \"duracion_minutos\":%d}",
                t.getId(),
                escapar(t.getCedula()),
                escapar(t.getNombres()),
                escapar(t.getCelular()),
                escapar(t.getEmail()),
                escapar(t.getMotivo()),
                t.getFecha().toString(),
                t.getHoraInicio().toString(),
                t.getDuracionMinutos()
            ));
            if (i < lista.size() - 1) json.append(",");
        }
        json.append("]");

        out.print(json.toString());
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json; charset=UTF-8");
        PrintWriter out = response.getWriter();

        String accion = request.getParameter("accion");

        if ("eliminar".equals(accion)) {
            int id = Integer.parseInt(request.getParameter("id"));
            if (dao.eliminar(id)) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"mensaje\":\"Turno eliminado\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\":\"No se pudo eliminar\"}");
            }
            return;
        }

        try {
            String cedula = request.getParameter("cedula");
            String nombres = request.getParameter("nombres");
            String celular = request.getParameter("celular");
            String email = request.getParameter("email");
            String motivo = request.getParameter("motivo");
            Date fecha = Date.valueOf(request.getParameter("fecha"));
            
            String horaStr = request.getParameter("hora_inicio");
            if (horaStr != null && horaStr.length() == 5) horaStr += ":00";
            Time horaInicio = Time.valueOf(horaStr);
            
            int duracion = Integer.parseInt(request.getParameter("duracion_minutos"));

            TurnoPodologia turno = new TurnoPodologia(cedula, nombres, celular, email, motivo, fecha, horaInicio, duracion);

            if (dao.insertar(turno)) {
                response.setStatus(HttpServletResponse.SC_OK);
                out.print("{\"mensaje\":\"Turno guardado\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\":\"Error en la base de datos\"}");
            }
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"error\":\"Datos inválidos: " + e.getMessage() + "\"}");
        }
    }

    private String escapar(String val) {
        return val == null ? "" : val.replace("\"", "\\\"").replace("\n", " ");
    }
}