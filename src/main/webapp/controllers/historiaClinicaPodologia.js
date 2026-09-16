// --- GESTIÓN DE TURNOS Y HISTORIA CLÍNICA PODOLÓGICA (MYSQL / RAILWAY) ---

let turnos = [];

// Inicialización de eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    cargarTurnosDB();

    const formTurno = document.getElementById('form-turno');
    if (formTurno) {
        formTurno.addEventListener('submit', guardarTurno);
    }
});

// 1. Obtener los turnos desde la base de datos
async function cargarTurnosDB() {
    try {
        const response = await fetch('/ControladorTurnos');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const turnosDB = await response.json();

        if (Array.isArray(turnosDB)) {
            // Mapeo directo a la estructura de la tabla turnos_podologia
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

            // Si existe la función de renderizado en tu vista, se ejecuta
            if (typeof renderizarCalendario === 'function') {
                renderizarCalendario();
            }
        }
    } catch (error) {
        console.error("Error al obtener los turnos desde Railway:", error);
    }
}

// 2. Guardar o actualizar un turno en MySQL
async function guardarTurno(e) {
    if (e) e.preventDefault();

    const cedula = document.getElementById('turnCedula')?.value.trim();
    const nombres = document.getElementById('turnNombres')?.value.trim().toUpperCase();
    const celular = document.getElementById('turnCelular')?.value.trim();
    const email = document.getElementById('turnEmail')?.value.trim().toLowerCase();
    const motivo = document.getElementById('turnMotivo')?.value.trim();
    const fecha = document.getElementById('fecha-agenda')?.value;
    const hora = document.getElementById('hora-inicio')?.value;
    const duracion = document.getElementById('turnDuracion')?.value || '40';

    if (!cedula || !fecha || !hora) {
        alert("La Cédula, Fecha y Hora son campos requeridos.");
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("cedula", cedula);
        formData.append("nombres", nombres || "");
        formData.append("celular", celular || "");
        formData.append("email", email || "");
        formData.append("motivo", motivo || "");
        formData.append("fecha", fecha);
        formData.append("hora_inicio", hora);
        formData.append("duracion_minutos", duracion);

        const response = await fetch('/ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        if (response.ok) {
            alert("¡Turno registrado exitosamente!");
            if (typeof cerrarModal === 'function') cerrarModal();
            limpiarFormulario();
            cargarTurnosDB();
        } else {
            const data = await response.json();
            alert("Atención: " + (data.error || "No se pudo agendar el turno."));
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        alert("Error de conexión al guardar el turno.");
    }
}

// 3. Eliminar / Cancelar un turno por ID o Cédula
async function cancelarTurno(id) {
    if (!confirm('¿Desea cancelar este turno?')) return;

    try {
        const formData = new URLSearchParams();
        formData.append("accion", "eliminar");
        formData.append("id", id);

        const response = await fetch('/ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        if (response.ok) {
            alert("Turno eliminado correctamente.");
            cargarTurnosDB();
        } else {
            const data = await response.json();
            alert("Atención: " + (data.error || "No se pudo eliminar el turno."));
        }
    } catch (error) {
        console.error("Error al cancelar turno:", error);
        alert("Error de conexión al eliminar.");
    }
}

// 4. Utilidad para limpiar el formulario
function limpiarFormulario() {
    const campos = ['turnCedula', 'turnNombres', 'turnCelular', 'turnEmail', 'turnMotivo', 'fecha-agenda', 'hora-inicio'];
    campos.forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
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
