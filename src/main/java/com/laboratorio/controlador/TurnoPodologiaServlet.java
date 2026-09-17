package com.laboratorio.controlador;

import com.google.gson.Gson;
import java.io.IOException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "ControladorTurnos", urlPatterns = {"/ControladorTurnos"})
public class TurnoPodologiaServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(TurnoPodologiaServlet.class.getName());
    private final Gson gson = new Gson();
    private final TurnosPodologiaDAO dao = new TurnosPodologiaDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        String fecha = request.getParameter("fecha");

        if (fecha == null || fecha.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"Se requiere la fecha para consultar la agenda.\"}");
            return;
        }

        try {
            List<TurnoPodologia> lista = dao.listarPorFecha(fecha);
            response.getWriter().write(gson.toJson(lista));
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error en doGet: ControladorTurnos", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al consultar la agenda.\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        String accion = request.getParameter("accion");

        try {
            if ("eliminar".equals(accion)) {
                int id = Integer.parseInt(request.getParameter("id"));
                boolean ok = dao.eliminar(id);
                if (ok) {
                    response.getWriter().write("{\"status\": \"OK\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("{\"error\": \"Turno no encontrado.\"}");
                }
                return;
            }

            TurnoPodologia t = new TurnoPodologia();
            String idStr = request.getParameter("id");
            if (idStr != null && !idStr.trim().isEmpty()) {
                t.setId(Integer.parseInt(idStr));
            }

            t.setCedula(request.getParameter("turnCedula"));
            t.setNombres(request.getParameter("turnNombres"));
            t.setCelular(request.getParameter("turnCelular"));
            t.setEmail(request.getParameter("turnEmail"));
            t.setMotivo(request.getParameter("turnMotivo"));
            t.setFecha(request.getParameter("fecha"));
            t.setHoraInicio(request.getParameter("horaInicio"));
            t.setDuracionMinutos(Integer.parseInt(request.getParameter("duracionMinutos")));

            boolean guardado = dao.guardarOActualizar(t);

            if (guardado) {
                response.getWriter().write("{\"status\": \"OK\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"No se pudo guardar la cita.\"}");
            }

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error en doPost: ControladorTurnos", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error procesando la solicitud: " + e.getMessage() + "\"}");
        }
    }
}
