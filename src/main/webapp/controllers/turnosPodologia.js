// --- VARIABLES Y CONFIGURACIÓN GENERAL ---
const HORARIOS_AGENDA = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", 
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", 
    "20:00", "20:30", "21:00"
];

let turnosDelDia = [];

// --- INICIALIZACIÓN DE LA AGENDA ---
document.addEventListener('DOMContentLoaded', () => {
    poblarHorasInicio();
    
    const fechaInput = document.getElementById('fecha-agenda');
    if (fechaInput && !fechaInput.value) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
    
    const turnCedula = document.getElementById('turnCedula');
    if (turnCedula) {
        turnCedula.addEventListener('blur', (e) => autocompletarPacienteTurno(e.target.value.trim()));
    }

    renderizarCalendario();
});

function poblarHorasInicio() {
    const select = document.getElementById('hora-inicio');
    if (!select) return;
    select.innerHTML = HORARIOS_AGENDA.map(h => `<option value="${h}">${h}</option>`).join('');
}

// --- NAVEGACIÓN DE FECHAS ---
function cambiarDia(delta) {
    const input = document.getElementById('fecha-agenda');
    if (!input || !input.value) return;

    const fecha = new Date(input.value + 'T00:00:00');
    fecha.setDate(fecha.getDate() + delta);
    input.value = fecha.toISOString().split('T')[0];
    renderizarCalendario();
}

// --- AUTOCOMPLETAR PACIENTE EXISTENTE ---
async function autocompletarPacienteTurno(cedula) {
    if (!cedula || cedula.length < 5) return;
    try {
        const res = await fetch(`/ControladorPacientes?accion=buscar&cedula=${encodeURIComponent(cedula)}`);
        if (res.ok) {
            const p = await res.json();
            if (p) {
                if (document.getElementById('turnNombres')) document.getElementById('turnNombres').value = p.nombres || '';
                if (document.getElementById('turnCelular')) document.getElementById('turnCelular').value = p.telefono || '';
                if (document.getElementById('turnEmail')) document.getElementById('turnEmail').value = p.correo || '';
            }
        }
    } catch (e) {
        console.error("Error al autocompletar paciente en turno:", e);
    }
}

// --- RENDERIZADO DE LA TABLA HORARIA ---
async function renderizarCalendario() {
    const tbody = document.getElementById('cuerpo-calendario');
    const fechaInput = document.getElementById('fecha-agenda');
    if (!tbody || !fechaInput) return;

    const fecha = fechaInput.value;
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding: 20px;">Cargando agenda...</td></tr>';

    try {
        const res = await fetch(`/ControladorTurnos?fecha=${encodeURIComponent(fecha)}`);
        if (!res.ok) throw new Error("Error obteniendo datos del servidor");
        
        turnosDelDia = await res.json();
        tbody.innerHTML = '';

        HORARIOS_AGENDA.forEach(hora => {
            const turnosEnBloque = turnosDelDia.filter(t => t.horaInicio === hora);
            const tr = document.createElement('tr');

            let tarjetasHTML = turnosEnBloque.map(t => `
                <div class="card-turno-pro" style="background:#e0f2fe; border-left: 4px solid #0284c7; padding: 8px 12px; margin-bottom: 6px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${t.nombres}</strong> <small>(${t.cedula})</small><br>
                        <span style="font-size: 0.85rem; color: #334155;">Motivo: ${t.motivo} | Tel: ${t.celular}</span><br>
                        <span style="font-size: 0.75rem; background: #bae6fd; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${t.duracionMinutos} min</span>
                    </div>
                    <div>
                        <button class="btn-action" onclick="editarTurno(${t.id})" style="padding: 3px 8px; font-size: 0.8rem;">Editar</button>
                        <button class="btn-delete" onclick="eliminarTurno(${t.id})" style="padding: 3px 8px; font-size: 0.8rem;">Eliminar</button>
                    </div>
                </div>
            `).join('');

            const cuposDisponibles = 3 - turnosEnBloque.length;
            let botonAgregar = '';
            if (cuposDisponibles > 0) {
                botonAgregar = `
                    <button type="button" class="btn-secondary-pro" onclick="abrirModalNuevoTurno('${hora}')" style="font-size: 0.8rem; padding: 4px 10px; border-style: dashed;">
                        + Agendar en ${hora} (${cuposDisponibles} cupo${cuposDisponibles > 1 ? 's' : ''})
                    </button>
                `;
            }

            tr.innerHTML = `
                <td style="font-weight: bold; color: #475569; vertical-align: top;">${hora}</td>
                <td>
                    ${tarjetasHTML}
                    ${botonAgregar}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red; padding: 20px;">Error al cargar los turnos agendados.</td></tr>';
    }
}

// --- MODAL: ABRIR, CERRAR Y EDITAR ---
function abrirModalNuevoTurno(horaInicio = '08:00') {
    document.getElementById('form-turno').reset();
    document.getElementById('turno-id').value = '';
    document.getElementById('modal-titulo').innerText = 'Agendar Nueva Cita';
    document.getElementById('hora-inicio').value = horaInicio;
    
    const modal = document.getElementById('modal-turno');
    if (modal) modal.style.display = 'flex';
}

function cerrarModal() {
    const modal = document.getElementById('modal-turno');
    if (modal) modal.style.display = 'none';
}

function editarTurno(id) {
    const turno = turnosDelDia.find(t => t.id === id);
    if (!turno) return;

    document.getElementById('turno-id').value = turno.id;
    document.getElementById('turnCedula').value = turno.cedula;
    document.getElementById('turnNombres').value = turno.nombres;
    document.getElementById('turnCelular').value = turno.celular;
    document.getElementById('turnEmail').value = turno.email || '';
    document.getElementById('turnMotivo').value = turno.motivo;
    document.getElementById('hora-inicio').value = turno.horaInicio;
    document.getElementById('duracion-minutos').value = turno.duracionMinutos;

    document.getElementById('modal-titulo').innerText = 'Editar Cita Podológica';
    document.getElementById('modal-turno').style.display = 'flex';
}

// --- GUARDAR Y ELIMINAR TURNOS ---
async function guardarTurno(event) {
    event.preventDefault();

    const fecha = document.getElementById('fecha-agenda').value;
    if (!fecha) {
        alert("Seleccione una fecha válida en la agenda.");
        return;
    }

    const params = new URLSearchParams();
    params.append('id', document.getElementById('turno-id').value);
    params.append('turnCedula', document.getElementById('turnCedula').value.trim());
    params.append('turnNombres', document.getElementById('turnNombres').value.trim());
    params.append('turnCelular', document.getElementById('turnCelular').value.trim());
    params.append('turnEmail', document.getElementById('turnEmail').value.trim());
    params.append('turnMotivo', document.getElementById('turnMotivo').value.trim());
    params.append('horaInicio', document.getElementById('hora-inicio').value);
    params.append('duracionMinutos', document.getElementById('duracion-minutos').value);
    params.append('fecha', fecha);

    try {
        const res = await fetch('/ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        const data = await res.json();
        if (res.ok) {
            alert("Cita agendada correctamente.");
            cerrarModal();
            renderizarCalendario();
        } else {
            alert("Atención: " + (data.error || "No se pudo guardar la cita."));
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión al guardar la cita.");
    }
}

async function eliminarTurno(id) {
    if (!confirm("¿Está seguro de cancelar/eliminar esta cita podológica?")) return;

    const params = new URLSearchParams();
    params.append('accion', 'eliminar');
    params.append('id', id);

    try {
        const res = await fetch('/ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });

        if (res.ok) {
            alert("Cita eliminada correctamente.");
            renderizarCalendario();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "No se pudo eliminar."));
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión al eliminar.");
    }
}