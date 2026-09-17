// --- GESTIÓN DE TURNOS Y CALENDARIO PODOLÓGICO ---

// 1. Guardar una nueva cita al hacer clic en "Guardar Cita"
async function guardarCita() {
    const cedula = document.getElementById('txtCedula').value.trim();
    const nombres = document.getElementById('txtNombres').value.trim();
    const celular = document.getElementById('txtCelular').value.trim();
    const email = document.getElementById('txtEmail').value.trim();
    const motivo = document.getElementById('txtMotivo').value.trim();
    const fecha = document.getElementById('txtFecha').value; // Formato YYYY-MM-DD
    const horaInicio = document.getElementById('selectHora').value; // Ej: "08:00"
    
    // Extraer solo los números de "40 Minutos" -> 40
    const duracionRaw = document.getElementById('selectDuracion').value;
    const duracionMinutos = parseInt(duracionRaw) || 30;

    const params = new URLSearchParams({
        cedula: cedula,
        nombres: nombres,
        celular: celular,
        email: email,
        motivo: motivo,
        fecha: fecha,
        hora_inicio: horaInicio,
        duracion_minutos: duracionMinutos
    });

    try {
        const response = await fetch('ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
            body: params
        });

        const data = await response.json();

        if (response.ok && data.status === "OK") {
            alert("Cita agendada con éxito");
            cargarCitasPorFecha(fecha); // Recargar la tabla del calendario
        } else {
            alert("Error al guardar: " + (data.error || "Error desconocido"));
        }
    } catch (err) {
        console.error("Error de red o servidor:", err);
    }
}

// 2. Cargar las citas agendadas en la tabla según la fecha seleccionada
async function cargarCitasPorFecha(fechaSeleccionada) {
    try {
        const response = await fetch(`ControladorTurnos?fecha=${fechaSeleccionada}`);
        const turnos = await response.json();

        // Limpiar y renderizar en el contenedor del calendario
        const contenedor = document.getElementById('contenedorTurnos');
        contenedor.innerHTML = '';

        if (turnos.length === 0) {
            contenedor.innerHTML = '<tr><td colspan="3">No hay citas agendadas para esta fecha.</td></tr>';
            return;
        }

        turnos.forEach(t => {
            contenedor.innerHTML += `
                <tr>
                    <td>${t.horaInicio} (${t.duracionMinutos} min)</td>
                    <td><strong>${t.nombres}</strong><br><small>${t.cedula} - ${t.celular || ''}</small></td>
                    <td>${t.motivo}</td>
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error al obtener los turnos:", err);
    }
}








// Función para autocompletar el modal de turnos al escribir la cédula
async function buscarPacienteParaTurno(cedula) {
    if (!cedula || cedula.length < 5) return;
    
    try {
        const response = await fetch(`/ControladorPacientes?accion=buscar&cedula=${encodeURIComponent(cedula)}`);
        if (response.ok) {
            const paciente = await response.json();
            if (paciente) {
                if (document.getElementById('turnNombres')) document.getElementById('turnNombres').value = paciente.nombres || '';
                if (document.getElementById('turnCelular')) document.getElementById('turnCelular').value = paciente.telefono || '';
                if (document.getElementById('turnEmail')) document.getElementById('turnEmail').value = paciente.correo || '';
            }
        }
    } catch (error) {
        console.error("Error al buscar paciente para el turno:", error);
    }
}

// Escuchador de evento en el input de Cédula del Turno
document.addEventListener('DOMContentLoaded', () => {
    const inputTurnCedula = document.getElementById('turnCedula');
    if (inputTurnCedula) {
        inputTurnCedula.addEventListener('blur', (e) => buscarPacienteParaTurno(e.target.value.trim()));
    }
});

