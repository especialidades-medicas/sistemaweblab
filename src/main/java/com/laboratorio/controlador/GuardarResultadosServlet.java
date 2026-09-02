package com.laboratorio.controlador;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.logging.Level;
import java.util.logging.Logger;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

@WebServlet(name = "GuardarPdfServlet", urlPatterns = {"/GuardarPdfServlet"})
@MultipartConfig(
    fileSizeThreshold = 1024 * 1024 * 2,  // 2MB
    maxFileSize = 1024 * 1024 * 10,        // 10MB
    maxRequestSize = 1024 * 1024 * 50      // 50MB
)
public class GuardarPdfServlet extends HttpServlet {

    private static final Logger LOGGER = Logger.getLogger(GuardarPdfServlet.class.getName());

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        
        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try {
            // 1. Obtener parámetros enviados por FormData desde JavaScript
            String carpetaFecha = request.getParameter("fecha");
            String nombreArchivo = request.getParameter("nombreArchivo");
            Part archivoPart = request.getPart("pdfFile");

            if (carpetaFecha == null || nombreArchivo == null || archivoPart == null 
                || carpetaFecha.trim().isEmpty() || nombreArchivo.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\", \"message\":\"Faltan datos requeridos o el archivo PDF.\"}");
                return;
            }

            // Prevención de Path Traversal (limpia caracteres ../ en los nombres)
            carpetaFecha = new File(carpetaFecha).getName();
            nombreArchivo = new File(nombreArchivo).getName();

            // 2. Definición de la ruta física de almacenamiento
            // Prioriza una variable de entorno si usas un Volume en Railway, o el path del Servlet
            String rutaBase = System.getenv("PDF_STORAGE_DIR");
            if (rutaBase == null || rutaBase.trim().isEmpty()) {
                String realPath = getServletContext().getRealPath("/");
                rutaBase = (realPath != null) ? realPath + "Resultados" : "Resultados";
            }

            File dirFecha = new File(rutaBase, carpetaFecha);
            if (!dirFecha.exists()) {
                dirFecha.mkdirs();
            }

            File archivoFinal = new File(dirFecha, nombreArchivo);

            // 3. Guardado/Reemplazo del archivo usando NIO
            try (InputStream inputStream = archivoPart.getInputStream()) {
                Files.copy(inputStream, archivoFinal.toPath(), StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                LOGGER.log(Level.SEVERE, "Error de escritura al guardar PDF: " + e.getMessage(), e);
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\", \"message\":\"El archivo podría estar bloqueado o no se tienen permisos de escritura.\"}");
                return;
            }

            LOGGER.info("PDF guardado con éxito en: " + archivoFinal.getAbsolutePath());

            // 4. Respuesta de confirmación
            response.setStatus(HttpServletResponse.SC_OK);
            out.print("{\"status\":\"success\", \"message\":\"PDF guardado correctamente en Resultados/" 
                    + carpetaFecha + "/" + nombreArchivo + "\"}");

        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error procesando la solicitud de PDF: " + e.getMessage(), e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\", \"message\":\"Error interno: " + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setStatus(HttpServletResponse.SC_METHOD_NOT_ALLOWED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().print("{\"status\":\"error\", \"message\":\"Método GET no permitido para subir archivos.\"}");
    }

    @Override
    public String getServletInfo() {
        return "Servlet para guardar y organizar PDFs de resultados en el servidor";
    }
}
