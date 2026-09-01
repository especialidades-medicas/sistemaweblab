package com.laboratorio.controlador;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class Conexion {
    // Lee las variables de entorno inyectadas por Railway; si no existen, usa las locales/proxy
    private static final String HOST = System.getenv("MYSQLHOST") != null ? System.getenv("MYSQLHOST") : "nozomi.proxy.rlwy.net"; 
    private static final String PORT = System.getenv("MYSQLPORT") != null ? System.getenv("MYSQLPORT") : "29699"; 
    private static final String DATABASE = System.getenv("MYSQLDATABASE") != null ? System.getenv("MYSQLDATABASE") : "especialidades_medicas"; 
    private static final String USER = System.getenv("MYSQLUSER") != null ? System.getenv("MYSQLUSER") : "root";
    private static final String PASSWORD = System.getenv("MYSQLPASSWORD") != null ? System.getenv("MYSQLPASSWORD") : "iULyjSOesTuqIwMalEzTlcOsrggqmlPf";

    private static final String URL = "jdbc:mysql://" + HOST + ":" + PORT + "/" + DATABASE + "?useSSL=false&serverTimezone=UTC";

    public static Connection getConnection() {
        Connection conexion = null;
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            conexion = DriverManager.getConnection(URL, USER, PASSWORD);
        } catch (ClassNotFoundException | SQLException e) {
            System.out.println("Error al conectar a la base de datos: " + e.getMessage());
        }
        return conexion;
    }
}
