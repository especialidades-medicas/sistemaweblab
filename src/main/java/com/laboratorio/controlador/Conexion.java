package com.laboratorio.controlador;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Conexion {
    private static final Logger LOGGER = Logger.getLogger(Conexion.class.getName());

    private static final String HOST = "nozomi.proxy.rlwy.net"; 
    private static final String PORT = "29699"; 
    private static final String DATABASE = "especialidades_medicas"; 
    
    private static final String URL = "jdbc:mysql://" + HOST + ":" + PORT + "/" + DATABASE + "?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
    private static final String USER = "root";
    private static final String PASSWORD = "iULyjSOesTuqIwMalEzTlcOsrggqmlPf";

    public static Connection getConnection() {
        Connection conexion = null;
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            conexion = DriverManager.getConnection(URL, USER, PASSWORD);
        } catch (ClassNotFoundException e) {
            LOGGER.log(Level.SEVERE, "Driver MySQL no encontrado en el classpath.", e);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error de conexión JDBC a MySQL en Railway: " + e.getMessage(), e);
        }
        return conexion;
    }
}
