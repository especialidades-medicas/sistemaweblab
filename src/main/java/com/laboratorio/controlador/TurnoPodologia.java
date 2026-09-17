package com.laboratorio.controlador;

public class TurnoPodologia {
    private int id;
    private String cedula;
    private String nombres;
    private String celular;
    private String email;
    private String motivo;
    private String fecha;
    private String horaInicio;
    private int duracionMinutos;
    private String creadoEn;

    public TurnoPodologia() {}

    public TurnoPodologia(String cedula, String nombres, String celular, String email, 
                          String motivo, String fecha, String horaInicio, int duracionMinutos) {
        this.cedula = cedula;
        this.nombres = nombres;
        this.celular = celular;
        this.email = email;
        this.motivo = motivo;
        this.fecha = fecha;
        this.horaInicio = horaInicio;
        this.duracionMinutos = duracionMinutos;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getCedula() { return cedula; }
    public void setCedula(String cedula) { this.cedula = cedula; }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }

    public String getCelular() { return celular; }
    public void setCelular(String celular) { this.celular = celular; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }

    public String getHoraInicio() { return horaInicio; }
    public void setHoraInicio(String horaInicio) { this.horaInicio = horaInicio; }

    public int getDuracionMinutos() { return duracionMinutos; }
    public void setDuracionMinutos(int duracionMinutos) { this.duracionMinutos = duracionMinutos; }

    public String getCreadoEn() { return creadoEn; }
    public void setCreadoEn(String creadoEn) { this.creadoEn = creadoEn; }
}
