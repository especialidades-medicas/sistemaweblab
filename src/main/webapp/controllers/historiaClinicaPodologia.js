// --- GESTIÓN DE TURNOS DE PODOLOGÍA (RAILWAY / MYSQL) ---

// 1. Cargar/Consultar turnos desde la base de datos
async function cargarTurnosDB() {
    try {
        // Usamos el mismo endpoint /ControladorPacientes registrado en PacienteServlet.java
        const response = await fetch('/ControladorPacientes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const turnosDB = await response.json();
        
        if (Array.isArray(turnosDB)) {
            turnos = turnosDB.map(t => ({
                id: t.id ? t.id.toString() : '',
                cedula: t.cedula || '',
                nombres: t.nombres || '',
                celular: t.telefono || '',
                email: t.correo || '',
                motivo: t.motivo || '',
                fecha: t.fechaNacimiento || t.fecha || '',
                hora: t.hora_inicio || t.hora || '',
                duracion: t.duracion_minutos || t.duracion || '40'
            }));

            if (typeof renderizarCalendario === 'function') {
                renderizarCalendario();
            }
        }

    } catch (error) {
        console.error("Error al obtener los datos desde Railway:", error);
    }
}

// 2. Guardar o Actualizar Turno en la BD
async function guardarTurno(e) {
    if (e) e.preventDefault();

    const id = document.getElementById('turno-id')?.value || '';
    const fecha = document.getElementById('fecha-agenda')?.value || '';
    const hora = document.getElementById('hora-inicio')?.value || '';
    const cedula = document.getElementById('turnCedula')?.value.trim();

    if (!cedula) {
        alert("La cédula es un campo obligatorio.");
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("patCedula", cedula);
        formData.append("patNombre", document.getElementById('turnNombres')?.value.trim().toUpperCase() || "");
        formData.append("patTelefono", document.getElementById('turnCelular')?.value.trim() || "");
        formData.append("patCorreo", document.getElementById('turnEmail')?.value.trim().toLowerCase() || "");

        const response = await fetch('/ControladorPacientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const data = await response.json();

        if (response.ok) {
            alert("¡Turno guardado con éxito!");
            if (typeof cerrarModal === 'function') cerrarModal();
            cargarTurnosDB();
        } else {
            alert("Atención: " + (data.error || "No se pudo guardar la información."));
        }

    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
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
