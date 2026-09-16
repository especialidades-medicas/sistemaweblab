// --- GESTIÓN DE TURNOS DE PODOLOGÍA (RAILWAY / MYSQL) ---

// 1. Obtener los turnos guardados en MySQL (Railway)
async function cargarTurnosDB() {
    try {
        const response = await fetch('/ControladorTurnos');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const turnosDB = await response.json();

        if (Array.isArray(turnosDB)) {
            turnos = turnosDB.map(t => ({
                id: t.id ? t.id.toString() : '',
                cedula: t.cedula || '',
                nombres: t.nombres || '',
                celular: t.celular || '',
                email: t.email || '',
                motivo: t.motivo || '',
                fecha: t.fecha || '',
                hora: t.hora_inicio || '',
                duracion: t.duracion_minutos || 40
            }));

            if (typeof renderizarCalendario === 'function') {
                renderizarCalendario();
            }
        }
    } catch (error) {
        console.error("Error al obtener los turnos desde Railway:", error);
    }
}

// 2. Guardar un nuevo turno en turnos_podologia
async function guardarTurno(e) {
    if (e) e.preventDefault();

    const cedula = document.getElementById('turnCedula')?.value.trim();
    const fecha = document.getElementById('fecha-agenda')?.value || '';
    const hora = document.getElementById('hora-inicio')?.value || '';

    if (!cedula || !fecha || !hora) {
        alert("Cédula, Fecha y Hora son campos obligatorios.");
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("cedula", cedula);
        formData.append("nombres", document.getElementById('turnNombres')?.value.trim().toUpperCase() || "");
        formData.append("celular", document.getElementById('turnCelular')?.value.trim() || "");
        formData.append("email", document.getElementById('turnEmail')?.value.trim().toLowerCase() || "");
        formData.append("motivo", document.getElementById('turnMotivo')?.value.trim() || "");
        formData.append("fecha", fecha);
        formData.append("hora_inicio", hora);
        formData.append("duracion_minutos", document.getElementById('turnDuracion')?.value || "40");

        const response = await fetch('/ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        if (response.ok) {
            alert("¡Turno agendado con éxito!");
            if (typeof cerrarModal === 'function') cerrarModal();
            cargarTurnosDB();
        } else {
            const data = await response.json();
            alert("Atención: " + (data.error || "No se pudo guardar el turno."));
        }
    } catch (error) {
        console.error("Error al guardar el turno:", error);
        alert("Error de conexión al procesar el guardado.");
    }
}

// 3. Cancelar / Eliminar Turno en la BD
async function cancelarTurno(cedula) {
    if (!confirm('¿Está seguro de que desea cancelar este turno?')) return;

    try {
        const formData = new URLSearchParams();
        formData.append("accion", "eliminar");
        formData.append("cedula", cedula);

        const response = await fetch('/ControladorPacientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const data = await response.json();

        if (response.ok) {
            alert("Turno cancelado correctamente.");
            cargarTurnosDB();
        } else {
            alert("Atención: " + (data.error || "No se pudo eliminar el registro."));
        }
    } catch (error) {
        console.error("Error al cancelar el turno:", error);
        alert("Error de conexión al intentar cancelar.");
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
