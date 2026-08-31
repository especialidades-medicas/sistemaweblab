# Etapa de compilación con Maven
FROM maven:3.9-eclipse-temurin-21 AS build
COPY . /app
WORKDIR /app
RUN mvn clean package -DskipTests

# Etapa de ejecución con Tomcat y Java 21
FROM tomcat:10.1-jdk21
# Eliminar la aplicación por defecto de Tomcat
RUN rm -rf /usr/local/tomcat/webapps/*
# Copiar el archivo .war generado al directorio webapps de Tomcat renombrado como ROOT.war para que responda en la raíz
COPY --from=build /app/target/*.war /usr/local/tomcat/webapps/ROOT.war

EXPOSE 8080
CMD ["catalina.sh", "run"]
