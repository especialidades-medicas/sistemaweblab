/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/JSP_Servlet/Servlet.java to edit this template
 */

package com.laboratorio.controlador;

import java.io.IOException;
import java.io.PrintWriter;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet(name = "LoginServlet", urlPatterns = {"/LoginServlet"})
public class LoginServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("text/html;charset=UTF-8");
        
        String user = request.getParameter("usuario");
        String pass = request.getParameter("password");
        
        // Validación de credenciales solicitadas
        if ("admin".equals(user) && "1549".equals(pass)) {
            // Redirigir al panel principal si es correcto
            response.sendRedirect("views/dashboard.html");
        } else {
            // Mostrar error simple si fallan
            try (PrintWriter out = response.getWriter()) {
                out.println("<!DOCTYPE html>");
                out.println("<html><head><title>Error</title>");
                out.println("<link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'></head>");
                out.println("<body class='bg-light text-center p-5'>");
                out.println("<div class='card shadow mx-auto p-4' style='max-width: 400px;'>");
                out.println("<h3 class='text-danger'>Acceso Denegado</h3>");
                out.println("<p>Usuario o contraseña incorrectos.</p>");
                out.println("<a href='index.html' class='btn btn-primary mt-3'>Volver a intentar</a>");
                out.println("</div></body></html>");
            }
        }
    }
}