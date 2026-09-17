// --- GESTIÓN DE TURNOS Y CALENDARIO PODOLÓGICO ---

let turnos = [];

// Inicialización de eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    const inputFecha = document.getElementById('fecha-agenda');
    
    // 1. Establecer fecha por defecto a hoy si no hay una seleccionada
    if (inputFecha && !inputFecha.value) {
        inputFecha.value = new Date().toISOString().split('T')[0];
    }

    cargarOpcionesHorario();
    cargarTurnosDB(); // Primera carga desde MySQL

    // 2. Event listener para el formulario del modal de agendamiento
    const formTurno = document.getElementById('form-turno');
    if (formTurno) {
        formTurno.addEventListener('submit', guardarTurno);
    }

    // 3. Autocompletar paciente al ingresar/cambiar la cédula
    const inputTurnCedula = document.getElementById('turnCedula');
    if (inputTurnCedula) {
        inputTurnCedula.addEventListener('blur', (e) => buscarPacienteParaTurno(e.target.value.trim()));
    }
});

// --- CONEXIÓN CON EL BACKEND (ControladorTurnos / Railway) ---

// Cargar las citas de la fecha seleccionada en #fecha-agenda
async function cargarTurnosDB() {
    const inputFecha = document.getElementById('fecha-agenda');
    const fechaSeleccionada = inputFecha ? inputFecha.value : new Date().toISOString().split('T')[0];
    const cuerpo = document.getElementById('cuerpo-calendario');

    if (cuerpo) {
        cuerpo.innerHTML = `<tr><td colspan="2" style="text-align:center; padding: 20px; color: #64748b;">Cargando citas agendadas...</td></tr>`;
    }

    try {
        const response = await fetch(`./ControladorTurnos?accion=listar&fecha=${fechaSeleccionada}`);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const turnosDB = await response.json();

        if (Array.isArray(turnosDB)) {
            // Mapeo seguro ajustado a la tabla turnos_podologia
            turnos = turnosDB.map(t => ({
                id: t.id ? t.id.toString() : '',
                cedula: t.cedula || '',
                nombres: t.nombres || '',
                celular: t.celular || '',
                email: t.email || '',
                motivo: t.motivo || '',
                fecha: t.fecha || '',
                hora: t.horaInicio || t.hora_inicio || '',
                duracion: t.duracionMinutos || t.duracion_minutos || 30
            }));

            renderizarCalendario();
        }
    } catch (error) {
        console.error("Error al obtener turnos:", error);
        if (cuerpo) {
            cuerpo.innerHTML = `<tr><td colspan="2" style="text-align:center; color: #ef4444; padding: 20px;">Error al conectar con la base de datos.</td></tr>`;
        }
    }
}

// Guardar o actualizar cita en la base de datos
async function guardarTurno(e) {
    if (e) e.preventDefault();

    const idTurno = document.getElementById('turno-id')?.value;
    const cedula = document.getElementById('turnCedula')?.value.trim();
    const nombres = document.getElementById('turnNombres')?.value.trim().toUpperCase();
    const celular = document.getElementById('turnCelular')?.value.trim();
    const email = document.getElementById('turnEmail')?.value.trim().toLowerCase();
    const motivo = document.getElementById('turnMotivo')?.value.trim();
    const fecha = document.getElementById('modal-fecha')?.value || document.getElementById('fecha-agenda')?.value;
    const hora = document.getElementById('hora-inicio')?.value;
    const duracion = document.getElementById('duracion-minutos')?.value || '30';

    if (!cedula || !fecha || !hora) {
        alert("La Cédula, Fecha y Hora de inicio son requeridas.");
        return;
    }

    // Validación de negocio: Máximo 3 pacientes por bloque
    const turnosEnBloque = turnos.filter(t => t.fecha === fecha && t.hora.startsWith(hora.substring(0, 5)) && t.id !== idTurno);
    if (turnosEnBloque.length >= 3 && !idTurno) {
        alert('No es posible agendar más de 3 pacientes en el mismo bloque horario.');
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("accion", idTurno ? "actualizar" : "insertar");
        if (idTurno) formData.append("id", idTurno);
        formData.append("cedula", cedula);
        formData.append("nombres", nombres || "");
        formData.append("celular", celular || "");
        formData.append("email", email || "");
        formData.append("motivo", motivo || "");
        formData.append("fecha", fecha);
        formData.append("hora_inicio", hora);
        formData.append("duracion_minutos", duracion);

        const response = await fetch('./ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: formData.toString()
        });

        if (response.ok) {
            cerrarModal();
            cargarTurnosDB();
        } else {
            const data = await response.json().catch(() => ({}));
            alert("Atención: " + (data.error || "No se pudo agendar el turno."));
        }
    } catch (error) {
        console.error("Error al guardar turno:", error);
        alert("Error de conexión al guardar el turno.");
    }
}

// Cancelar / Eliminar cita podológica
async function cancelarTurno(id) {
    if (!confirm('¿Está seguro de cancelar este turno?')) return;

    try {
        const formData = new URLSearchParams();
        formData.append("accion", "eliminar");
        formData.append("id", id);

        const response = await fetch('./ControladorTurnos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: formData.toString()
        });

        if (response.ok) {
            cargarTurnosDB();
        } else {
            const data = await response.json().catch(() => ({}));
            alert("Atención: " + (data.error || "No se pudo eliminar el turno."));
        }
    } catch (error) {
        console.error("Error al eliminar turno:", error);
        alert("Error de red al eliminar.");
    }
}

// --- LÓGICA DE INTERFAZ Y RENDERIZADO DEL CALENDARIO ---

// Genera los bloques de 30 minutos desde 08:00 hasta 21:00
function obtenerIntervalos30Min() {
    const horarios = [];
    for (let h = 8; h <= 21; h++) {
        const horaStr = h < 10 ? `0${h}` : `${h}`;
        horarios.push(`${horaStr}:00`);
        if (h < 21) horarios.push(`${horaStr}:30`);
    }
    return horarios;
}

// Cambia la fecha con los botones < y >
function cambiarDia(offset) {
    const inputFecha = document.getElementById('fecha-agenda');
    if (!inputFecha) return;

    const fechaActual = new Date((inputFecha.value || new Date().toISOString().split('T')[0]) + 'T00:00:00');
    fechaActual.setDate(fechaActual.getDate() + offset);

    inputFecha.value = fechaActual.toISOString().split('T')[0];
    cargarTurnosDB();
}

// Renderiza las filas en el <tbody id="cuerpo-calendario">
function renderizarCalendario() {
    const inputFecha = document.getElementById('fecha-agenda');
    const cuerpo = document.getElementById('cuerpo-calendario');
    if (!inputFecha || !cuerpo) return;

    const fechaSeleccionada = inputFecha.value;
    cuerpo.innerHTML = '';

    obtenerIntervalos30Min().forEach(horaStr => {
        // Filtrar pacientes agendados en esta franja horaria
        const turnosEnHora = turnos.filter(t => t.fecha === fechaSeleccionada && t.hora.startsWith(horaStr.substring(0, 5)));
        const numPacientes = turnosEnHora.length;
        const esMediaHora = horaStr.endsWith(':30');

        let alertaHtml = '';
        if (numPacientes >= 2) {
            alertaHtml = `<div style="color: #d97706; font-size: 11px; margin-top: 4px; font-weight: 600;">⚠️ Ocupación múltiple: ${numPacientes} pacientes agendados.</div>`;
        }

        let tarjetasPacientes = turnosEnHora.map(t => {
            const mensajeTexto = `Saludos Sr/a ${t.nombres}, le recordamos su cita médica de Podología programada a las ${t.hora.substring(0, 5)} el día ${t.fecha}. Por favor acudir 10 minutos antes.`;
            const enlaceWS = `https://wa.me/${t.celular}?text=${encodeURIComponent(mensajeTexto)}`;

            let botonEmail = '';
            if (t.email && t.email.trim() !== '') {
                const asuntoEmail = encodeURIComponent("Recordatorio de Cita Podológica");
                const enlaceEmail = `mailto:${t.email}?subject=${asuntoEmail}&body=${encodeURIComponent(mensajeTexto)}`;
                botonEmail = `<a href="${enlaceEmail}" class="btn-action btn-email-pro" style="text-decoration:none; font-size:11px;" title="Enviar Correo">✉️ Email</a>`;
            }

            return `
                <div class="paciente-card-pro ${numPacientes > 1 ? 'sobreocupado' : ''}" style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #0284c7; padding: 8px 12px; margin-bottom: 6px; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                    <div class="paciente-info-pro">
                        <span class="nombre" style="font-weight: bold; font-size: 13px; color: #0f172a;">${t.nombres} <small style="font-weight:normal; color:#64748b">(CI: ${t.cedula})</small></span>
                        <div class="detalles" style="font-size: 12px; color: #334155; margin-top: 2px;">
                            <strong>Motivo:</strong> ${t.motivo || 'Consulta general'} | <strong>Duración:</strong> ${t.duracion} min
                        </div>
                    </div>
                    <div class="actions-group-pro" style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
                        ${t.celular ? `<a href="${enlaceWS}" target="_blank" class="btn-action btn-ws-pro" style="text-decoration:none; font-size:11px;" title="Enviar WhatsApp">📲 WhatsApp</a>` : ''}
                        ${botonEmail}
                        <button type="button" class="btn-action btn-edit-pro" style="font-size:11px; cursor:pointer;" onclick="editarTurno('${t.id}')">✏️ Editar</button>
                        <button type="button" class="btn-action btn-danger-pro" style="font-size:11px; cursor:pointer; color:#ef4444;" onclick="cancelarTurno('${t.id}')">❌ Cancelar</button>
                    </div>
                </div>
            `;
        }).join('');

        cuerpo.innerHTML += `
            <tr class="${esMediaHora ? 'media-hora' : ''}" style="border-bottom: 1px solid #f1f5f9;">
                <td style="width: 120px; font-weight: bold; vertical-align: top; padding: 10px; background: #f8fafc;">
                    <span style="color:#0f172a; font-size:14px;">${horaStr}</span>
                </td>
                <td style="padding: 10px;">
                    ${tarjetasPacientes || '<span style="color: #94a3b8; font-style: italic; font-size: 13px;">Disponible</span>'}
                    ${alertaHtml}
                    ${numPacientes >= 3 ? '<span style="color:#b91c1c; font-size:11px; font-weight:bold; display:block; margin-top:4px;">(Capacidad máxima de 3 pacientes alcanzada)</span>' : ''}
                </td>
            </tr>
        `;
    });
}

// --- AUXILIARES Y BÚSQUEDA DE PACIENTES ---

function cargarOpcionesHorario() {
    const select = document.getElementById('hora-inicio');
    if (!select) return;
    select.innerHTML = '';
    obtenerIntervalos30Min().forEach(horaStr => {
        select.innerHTML += `<option value="${horaStr}">${horaStr}</option>`;
    });
}

function abrirModalNuevoTurno() {
    const modalTitulo = document.getElementById('modal-titulo');
    if (modalTitulo) modalTitulo.innerText = "Agendar Nueva Cita Podológica";

    const turnoIdInput = document.getElementById('turno-id');
    if (turnoIdInput) turnoIdInput.value = '';

    const form = document.getElementById('form-turno');
    if (form) form.reset();

    const fechaCalendario = document.getElementById('fecha-agenda')?.value;
    const modalFecha = document.getElementById('modal-fecha');
    if (fechaCalendario && modalFecha) {
        modalFecha.value = fechaCalendario;
    }

    const modal = document.getElementById('modal-turno');
    if (modal) modal.style.display = 'flex';
}

function cerrarModal() {
    const modal = document.getElementById('modal-turno');
    if (modal) modal.style.display = 'none';
}

function editarTurno(id) {
    const turno = turnos.find(t => t.id === id || t.id === id.toString());
    if (!turno) return;

    const modalTitulo = document.getElementById('modal-titulo');
    if (modalTitulo) modalTitulo.innerText = "Editar Cita Podológica";

    if (document.getElementById('turno-id')) document.getElementById('turno-id').value = turno.id;
    if (document.getElementById('turnCedula')) document.getElementById('turnCedula').value = turno.cedula;
    if (document.getElementById('turnNombres')) document.getElementById('turnNombres').value = turno.nombres;
    if (document.getElementById('turnCelular')) document.getElementById('turnCelular').value = turno.celular;
    if (document.getElementById('turnEmail')) document.getElementById('turnEmail').value = turno.email || '';
    if (document.getElementById('turnMotivo')) document.getElementById('turnMotivo').value = turno.motivo;
    if (document.getElementById('modal-fecha')) document.getElementById('modal-fecha').value = turno.fecha;
    if (document.getElementById('hora-inicio')) document.getElementById('hora-inicio').value = turno.hora.substring(0, 5);
    if (document.getElementById('duracion-minutos')) document.getElementById('duracion-minutos').value = turno.duracion;

    const modal = document.getElementById('modal-turno');
    if (modal) modal.style.display = 'flex';
}

async function buscarPacienteParaTurno(cedula) {
    if (!cedula || cedula.length < 5) return;

    try {
        const response = await fetch(`./ControladorPacientes?accion=buscar&cedula=${encodeURIComponent(cedula)}`);
        if (response.ok) {
            const paciente = await response.json();
            if (paciente) {
                if (document.getElementById('turnNombres')) document.getElementById('turnNombres').value = paciente.nombres || '';
                if (document.getElementById('turnCelular')) document.getElementById('turnCelular').value = paciente.telefono || paciente.celular || '';
                if (document.getElementById('turnEmail')) document.getElementById('turnEmail').value = paciente.correo || paciente.email || '';
            }
        }
    } catch (error) {
        console.error("Error al buscar paciente:", error);
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

