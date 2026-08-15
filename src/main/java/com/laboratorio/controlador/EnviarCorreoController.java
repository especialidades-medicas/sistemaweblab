package com.laboratorio.controlador;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.Properties;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Jakarta Mail
import jakarta.mail.Authenticator;
import jakarta.mail.BodyPart;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.activation.DataHandler;
import jakarta.mail.util.ByteArrayDataSource;

@WebServlet(name = "EnviarCorreoController", urlPatterns = {"/EnviarCorreo"})
public class EnviarCorreoController extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        response.setContentType("text/plain;charset=UTF-8");
        
        // 1. Leer el cuerpo de la petición enviado desde JavaScript (Fetch)
        StringBuilder sb = new StringBuilder();
        String line;
        try (BufferedReader reader = request.getReader()) {
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        
        String cuerpoJson = sb.toString();

        // Extracción básica segura de parámetros del JSON recibido (email y pdfBase64)
        String correoDestino = extraerValorJson(cuerpoJson, "email");
        String pdfBase64 = extraerValorJson(cuerpoJson, "pdfBase64");
        String nombreArchivo = extraerValorJson(cuerpoJson, "nombreArchivo");

        if (correoDestino.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("Correo no proporcionado.");
            return;
        }

        if (nombreArchivo.isEmpty()) {
            nombreArchivo = "Resultado_Laboratorio.pdf";
        }

        // 2. Configuración del servidor SMTP (Gmail)
        String remitente = "especialidades.prolab@gmail.com";          
        String password = "dnfo nwut mmoa ucyd"; 

        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");

        Session session = Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(remitente, password);
            }
        });

        try {
            // 3. Crear el mensaje de correo con soporte para adjuntos (Multipart)
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(remitente));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(correoDestino));
            message.setSubject("Resultados de Exámenes - Centro Médico Biosalud");

            // Parte 1: Texto del mensaje
            BodyPart textoMessagePart = new MimeBodyPart();
            textoMessagePart.setText("Estimado paciente,\n\nAdjunto encontrará el documento PDF con los resultados de sus exámenes médicos.\n\nAtentamente,\nLaboratorio Clínico Biosalud.");

            MimeMultipart multipart = new MimeMultipart();
            multipart.addBodyPart(textoMessagePart);

            // Parte 2: Adjuntar el PDF si viene incluido en la petición
            if (pdfBase64 != null && !pdfBase64.isEmpty()) {
                if (pdfBase64.contains(",")) {
                    pdfBase64 = pdfBase64.split(",")[1];
                }

                byte[] pdfBytes = java.util.Base64.getDecoder().decode(pdfBase64);
                
                BodyPart adjuntoMessagePart = new MimeBodyPart();
                ByteArrayDataSource dataSource = new ByteArrayDataSource(pdfBytes, "application/pdf");
                adjuntoMessagePart.setDataHandler(new DataHandler(dataSource));
                adjuntoMessagePart.setFileName(nombreArchivo);
                
                multipart.addBodyPart(adjuntoMessagePart);
            }

            // Asociar las partes al mensaje principal
            message.setContent(multipart);

            // Enviar correo
            Transport.send(message);

            // Respuesta exitosa al frontend
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write("Correo enviado con éxito a " + correoDestino);
            
        } catch (MessagingException e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("Error al enviar el correo: " + e.getMessage());
        }
    }

    /* Método auxiliar rápido para extraer valores de un JSON plano sin usar librerías externas */
    private String extraerValorJson(String json, String clave) {
        try {
            String buscar = "\"" + clave + "\":";
            int idx = json.indexOf(buscar);
            if (idx == -1) return "";
            
            int inicioVal = idx + buscar.length();
            while (inicioVal < json.length() && (json.charAt(inicioVal) == ' ' || json.charAt(inicioVal) == '\"')) {
                inicioVal++;
            }
            
            // Si es un string delimitado por comillas
            if (json.charAt(inicioVal - 1) == '\"') {
                int finVal = json.indexOf("\"", inicioVal);
                if (finVal != -1) {
                    return json.substring(inicioVal, finVal);
                }
            } else {
                // Si es numérico o booleano
                int finVal = json.indexOf(",", inicioVal);
                if (finVal == -1) finVal = json.indexOf("}", inicioVal);
                if (finVal != -1) {
                    return json.substring(inicioVal, finVal).trim();
                }
            }
        } catch (Exception e) {
            System.err.println("Error extrayendo clave JSON: " + clave);
        }
        return "";
    }
}