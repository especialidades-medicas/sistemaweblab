package com.laboratorio.controlador;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

public class Conexion {
    private static final Logger LOGGER = Logger.getLogger(Conexion.class.getName());

    // Credenciales exactas obtenidas de tu panel de TiDB Cloud
    private static final String HOST = "gateway01.us-east-1.prod.aws.tidbcloud.com";
    private static final String PORT = "4000";
    private static final String DATABASE = "especialidades_medicas";
    
    // Conexión segura exigida por TiDB Cloud
    private static final String URL = "jdbc:mysql://" + HOST + ":" + PORT + "/" + DATABASE + 
            "?useSSL=true&enabledTLSProtocols=TLSv1.2,TLSv1.3&serverTimezone=UTC&allowPublicKeyRetrieval=true";
            
    private static final String USER = "3j6kUAzTajPZaXu.root";
    private static final String PASSWORD = "bwYziQ9ySRUpu905"; // Reemplaza esto

    public static Connection getConnection() {
        Connection conexion = null;
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            conexion = DriverManager.getConnection(URL, USER, PASSWORD);
            LOGGER.info("¡Conexión exitosa a TiDB Cloud!");
        } catch (ClassNotFoundException e) {
            LOGGER.log(Level.SEVERE, "Driver MySQL no encontrado en el classpath.", e);
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "Error de conexión JDBC a TiDB Cloud: " + e.getMessage(), e);
        }
        return conexion;
    }
}
