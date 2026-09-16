// --- GESTIÓN DE TURNOS DE PODOLOGÍA (RAILWAY / MYSQL) ---

// 1. Cargar/Consultar turnos desde la base de datos
async function cargarTurnosDB() {
    try {
        const response = await fetch('/ControladorTurnos');
        if (!response.ok) {
            console.warn(`El endpoint /ControladorTurnos devolvió estado ${response.status}. Se cargarán turnos locales temporalmente.`);
            return;
        }

        const turnosDB = await response.json();
        turnos = turnosDB.map(t => ({
            id: t.id ? t.id.toString() : '',
            cedula: t.cedula || '',
            nombres: t.nombres || '',
            celular: t.celular || '',
            email: t.email || '',
            motivo: t.motivo || '',
            fecha: t.fecha || '',
            hora: t.hora_inicio || t.hora || '',
            duracion: t.duracion_minutos || t.duracion || '40'
        }));

        renderizarCalendario();

    } catch (error) {
        console.error("Error al obtener los turnos desde Railway:", error);
    }
}

// 2. Guardar o Actualizar Turno en la BD
async function guardarTurno(e) {
    e.preventDefault();

    const id = document.getElementById('turno-id')?.value || '';
    const fecha = document.getElementById('fecha-agenda')?.value || '';
    const hora = document.getElementById('hora-inicio')?.value || '';
    const cedula = document.getElementById('turnCedula')?.value.trim();

    if (!cedula) {
        alert("La cédula es un campo obligatorio.");
        return;
    }

    // Validar límite de máximo 3 pacientes por intervalo en el cliente
    const turnosExistentes = turnos.filter(t => t.fecha === fecha && t.hora === hora && t.id !== id);
    if (turnosExistentes.length >= 3) {
        alert('No se pueden agendar más de 3 pacientes en el mismo bloque horario.');
        return;
    }

    try {
        const formData = new URLSearchParams();
        if (id) formData.append("id", id);
        formData.append("turnCedula", cedula);
        formData.append("turnNombres", document.getElementById('turnNombres')?.value.trim() || "");
        formData.append("turnCelular", document.getElementById('turnCelular')?.value.trim() || "");
        formData.append("turnEmail", document.getElementById('turnEmail')?.value.trim().toLowerCase() || "");
        formData.append("turnMotivo", document.getElementById('turnMotivo')?.value.trim() || "");
        formData.append("fechaAgenda", fecha);
        formData.append("horaInicio", hora);
        formData.append("duracionMinutos", document.getElementById('duracion-minutos')?.value || "40");

        const response = await fetch('/ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const data = await response.json();

        if (response.ok) {
            alert("¡Cita guardada correctamente!");
            cerrarModal();
            cargarTurnosDB(); // Recarga la lista desde Railway
        } else {
            alert("Atención: " + (data.error || "No se pudo agendar la cita."));
        }

    } catch (error) {
        console.error("Error al conectar con el servidor para guardar el turno:", error);
        alert("Error de conexión al procesar el turno.");
    }
}

// 3. Cancelar / Eliminar Turno en la BD
async function cancelarTurno(id) {
    if (!confirm('¿Está seguro de que desea cancelar este turno?')) return;

    try {
        const formData = new URLSearchParams();
        formData.append("accion", "eliminar");
        formData.append("id", id);

        const response = await fetch('/ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const data = await response.json();

        if (response.ok) {
            alert("Turno cancelado correctamente.");
            cargarTurnosDB(); // Recarga la lista desde Railway
        } else {
            alert("Atención: " + (data.error || "No se pudo cancelar el turno."));
        }
    } catch (error) {
        console.error("Error al eliminar el turno:", error);
        alert("Error de conexión al intentar cancelar el turno.");
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

// 4. Inicializar carga al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    cargarTurnosDB();
});
