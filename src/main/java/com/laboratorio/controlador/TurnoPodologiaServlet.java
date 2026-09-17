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

        try {
            List<TurnoPodologia> lista = dao.listar(fecha);
            response.getWriter().write(gson.toJson(lista));
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error en doGet: ControladorTurnos", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error interno en el servidor: " + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        String accion = request.getParameter("accion");

        try {
            // 1. ELIMINAR TURNO
            if ("eliminar".equals(accion)) {
                String idEliminar = request.getParameter("id");
                if (idEliminar == null || idEliminar.trim().isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    response.getWriter().write("{\"error\": \"El ID es obligatorio para eliminar.\"}");
                    return;
                }

                boolean eliminado = dao.eliminar(Integer.parseInt(idEliminar.trim()));
                if (eliminado) {
                    response.getWriter().write("{\"status\": \"OK\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("{\"error\": \"Turno no encontrado para eliminar.\"}");
                }
                return;
            }

            // 2. GUARDAR O ACTUALIZAR TURNO
            String idStr = request.getParameter("id");
            String fecha = request.getParameter("fecha");
            String horaInicio = request.getParameter("horaInicio");

            if (fecha == null || fecha.trim().isEmpty() || horaInicio == null || horaInicio.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\": \"La fecha y la hora de inicio son obligatorias.\"}");
                return;
            }

            TurnoPodologia turno = new TurnoPodologia();
            if (idStr != null && !idStr.trim().isEmpty()) {
                try {
                    turno.setId(Integer.parseInt(idStr.trim()));
                } catch (NumberFormatException ignored) {}
            }

            turno.setCedula(obtenerParametro(request, "turnCedula", "cedula"));
            turno.setNombres(obtenerParametro(request, "turnNombres", "nombres"));
            turno.setCelular(obtenerParametro(request, "turnCelular", "celular"));
            turno.setEmail(obtenerParametro(request, "turnEmail", "email"));
            turno.setMotivo(obtenerParametro(request, "turnMotivo", "motivo"));
            turno.setFecha(fecha.trim());
            turno.setHoraInicio(horaInicio.trim());

            String duracionStr = request.getParameter("duracionMinutos");
            int duracion = 30;
            if (duracionStr != null && !duracionStr.trim().isEmpty()) {
                try {
                    duracion = Integer.parseInt(duracionStr.trim());
                } catch (NumberFormatException ignored) {}
            }
            turno.setDuracionMinutos(duracion);

            boolean exito = dao.guardarOActualizar(turno);
            if (exito) {
                response.getWriter().write("{\"status\": \"OK\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"No se pudo guardar el turno en la base de datos.\"}");
            }

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error en doPost: ControladorTurnos", e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al procesar la solicitud: " + e.getMessage() + "\"}");
        }
    }

    private String obtenerParametro(HttpServletRequest request, String clavePrincipal, String claveAlternativa) {
        String valor = request.getParameter(clavePrincipal);
        if (valor == null || valor.trim().isEmpty()) {
            valor = request.getParameter(claveAlternativa);
        }
        return valor;
    }
}
