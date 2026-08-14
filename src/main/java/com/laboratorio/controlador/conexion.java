package com.laboratorio.controlador; // O borra esta línea si prefieres dejarlo en el default package

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class conexion {
    
    // Cambia "nombre_de_tu_base", "root" y tu contraseña según tu entorno local
    private static final String URL = "jdbc:mysql://localhost:3306/nombre_de_tu_base?useSSL=false&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASSWORD = "";

    public static Connection conectar() {
        Connection conn = null;
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            conn = DriverManager.getConnection(URL, USER, PASSWORD);
            System.out.println("¡Conexión exitosa a la base de datos!");
        } catch (ClassNotFoundException e) {
            System.out.println("Error: No se encontró el Driver de MySQL -> " + e.getMessage());
        } catch (SQLException e) {
            System.out.println("Error de conexión a la Base de Datos -> " + e.getMessage());
        }
        return conn;
    }
}