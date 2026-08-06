package com.laboratorio.controlador;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
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
    maxFileSize = 1024 * 1024 * 10,       // 10MB
    maxRequestSize = 1024 * 1024 * 50     // 50MB
)
public class GuardarPdfServlet extends HttpServlet {

    protected void processRequest(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        try {
            // 1. Obtener parámetros enviados por FormData desde JavaScript
            String carpetaFecha = request.getParameter("fecha"); // Ejemplo: 01082026
            String nombreArchivo = request.getParameter("nombreArchivo"); // Ejemplo: 001245_oyaque_manobanda_brigette_antonella_01082026.pdf
            Part archivoPart = request.getPart("pdfFile");

            if (carpetaFecha == null || nombreArchivo == null || archivoPart == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"status\":\"error\", \"message\":\"Faltan datos requeridos.\"}");
                return;
            }

            // 2. Definir la ruta física donde se guardarán los archivos en el servidor o disco
            // Se guardará dentro de una carpeta llamada "Resultados" en la raíz del proyecto o ruta del sistema
            String rutaBase = getServletContext().getRealPath("/") + "Resultados";
            File dirFecha = new File(rutaBase + File.separator + carpetaFecha);

            // Crear las carpetas si no existen
            if (!dirFecha.exists()) {
                dirFecha.mkdirs();
            }

            File archivoFinal = new File(dirFecha, nombreArchivo);

            // 3. Validar si ya existe el archivo (para control de reemplazo o aviso de abierto)
            boolean yaExiste = archivoFinal.exists();

            // 4. Guardar o sobrescribir el archivo recibido
            try (InputStream inputStream = archivoPart.getInputStream();
                 FileOutputStream outputStream = new FileOutputStream(archivoFinal)) {
                
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
            } catch (IOException e) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"status\":\"error\", \"message\":\"El archivo podría estar abierto o bloqueado por otra aplicación.\"}");
                return;
            }

            // 5. Respuesta exitosa de vuelta a JavaScript
            response.setStatus(HttpServletResponse.SC_OK);
            out.print("{\"status\":\"success\", \"message\":\"PDF guardado correctamente en Resultados/" + carpetaFecha + "/" + nombreArchivo + "\"}");

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        processRequest(request, response);
    }

    @Override
    public String getServletInfo() {
        return "Servlet para guardar y organizar PDFs de resultados en el servidor";
    }
}