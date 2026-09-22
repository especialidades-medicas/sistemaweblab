package com.laboratorio.controlador;

import com.google.gson.Gson;
import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "ControladorTurnosFisioterapia", urlPatterns = {"/ControladorTurnosFisioterapia"})
public class TurnoFisioterapiaServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(TurnoFisioterapiaServlet.class.getName());
    private final Gson gson = new Gson();
    private final TurnosFisioterapiaDAO dao = new TurnosFisioterapiaDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        
        String fecha = request.getParameter("fecha");

        try {
            List<TurnoFisioterapia> lista = dao.listar(fecha);
            response.getWriter().write(gson.toJson(lista));
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error en doGet: ControladorTurnosFisioterapia", e);
            enviarRespuestaError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error interno en el servidor: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        // Forzar codificación UTF-8 antes de leer parámetros para acentos y caracteres especiales
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        
        String accion = request.getParameter("accion");

        try {
            // Caso 1: Eliminar Turno
            if ("eliminar".equals(accion)) {
                String idEliminar = obtenerParametroMultiples(request, "id", "turnoId", "idEliminar", "turno-id");
                if (idEliminar == null || idEliminar.isEmpty()) {
                    enviarRespuestaError(response, HttpServletResponse.SC_BAD_REQUEST, "El ID es obligatorio para eliminar.");
                    return;
                }

                try {
                    int id = Integer.parseInt(idEliminar);
                    boolean eliminado = dao.eliminar(id);
                    if (eliminado) {
                        response.getWriter().write(gson.toJson(Collections.singletonMap("status", "OK")));
                    } else {
                        enviarRespuestaError(response, HttpServletResponse.SC_NOT_FOUND, "Turno no encontrado para eliminar.");
                    }
                } catch (NumberFormatException e) {
                    enviarRespuestaError(response, HttpServletResponse.SC_BAD_REQUEST, "El ID de eliminación no es válido.");
                }
                return;
            }

            // Caso 2: Guardar o Actualizar Turno
            // Búsqueda flexible del ID probando las diferentes claves habituales del formulario
            String idStr = obtenerParametroMultiples(request, "id", "turnoId", "turnId", "turno-id");
            String fecha = obtenerParametroMultiples(request, "fecha", "modal-fecha", "turnFecha", "fechaTurno");
            String horaInicio = obtenerParametroMultiples(request, "horaInicio", "turnHoraInicio", "hora_inicio", "hora");

            if (fecha == null || fecha.isEmpty() || horaInicio == null || horaInicio.isEmpty()) {
                enviarRespuestaError(response, HttpServletResponse.SC_BAD_REQUEST, "La fecha y la hora de inicio son obligatorias.");
                return;
            }

            TurnoFisioterapia turno = new TurnoFisioterapia();
            
            // Asignación de ID para edición
            if (idStr != null && !idStr.isEmpty()) {
                try {
                    turno.setId(Integer.parseInt(idStr));
                } catch (NumberFormatException e) {
                    LOGGER.log(Level.WARNING, "ID de turno no numérico recibido para edición: {0}", idStr);
                }
            }

            turno.setCedula(obtenerParametro(request, "turnCedula", "cedula"));
            turno.setNombres(obtenerParametro(request, "turnNombres", "nombres"));
            turno.setCelular(obtenerParametro(request, "turnCelular", "celular"));
            turno.setEmail(obtenerParametro(request, "turnEmail", "email"));
            turno.setMotivo(obtenerParametro(request, "turnMotivo", "motivo"));
            turno.setFecha(fecha);
            turno.setHoraInicio(horaInicio);

            String duracionStr = obtenerParametroMultiples(request, "duracionMinutos", "duracion", "turnDuracion");
            int duracion = 30;
            if (duracionStr != null && !duracionStr.isEmpty()) {
                try {
                    duracion = Integer.parseInt(duracionStr);
                } catch (NumberFormatException ignored) {}
            }
            turno.setDuracionMinutos(duracion);

            boolean exito = dao.guardarOActualizar(turno);
            if (exito) {
                response.getWriter().write(gson.toJson(Collections.singletonMap("status", "OK")));
            } else {
                enviarRespuestaError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "No se pudo guardar o actualizar el turno en la base de datos.");
            }

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error en doPost: ControladorTurnosFisioterapia", e);
            enviarRespuestaError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error al procesar la solicitud: " + e.getMessage());
        }
    }

    private String obtenerParametro(HttpServletRequest request, String clavePrincipal, String claveAlternativa) {
        String valor = request.getParameter(clavePrincipal);
        if (valor == null || valor.trim().isEmpty()) {
            valor = request.getParameter(claveAlternativa);
        }
        return valor != null ? valor.trim() : null;
    }

    private String obtenerParametroMultiples(HttpServletRequest request, String... claves) {
        for (String clave : claves) {
            String valor = request.getParameter(clave);
            if (valor != null && !valor.trim().isEmpty()) {
                return valor.trim();
            }
        }
        return null;
    }

    private void enviarRespuestaError(HttpServletResponse response, int statusCode, String mensaje) throws IOException {
        response.setStatus(statusCode);
        response.getWriter().write(gson.toJson(Collections.singletonMap("error", mensaje)));
    }
}
