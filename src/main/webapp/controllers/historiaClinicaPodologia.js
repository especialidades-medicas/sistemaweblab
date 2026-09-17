// --- GESTIÓN DE TURNOS Y HISTORIA CLÍNICA PODOLÓGICA (MYSQL / RAILWAY) ---

let turnos = [];

// Inicialización de eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha de agenda al día actual
    const hoy = new Date().toISOString().split('T')[0];
    const fechaAgendaInput = document.getElementById('fecha-agenda');
    if (fechaAgendaInput) {
        fechaAgendaInput.value = hoy;
        // Evento para renderizar la tabla al cambiar la fecha
        fechaAgendaInput.addEventListener('change', renderizarCalendario);
    }

    cargarOpcionesHorario();
    cargarTurnosDB(); // Carga inicial desde Railway

    const formTurno = document.getElementById('form-turno');
    if (formTurno) {
        formTurno.removeEventListener('submit', guardarTurno);
        formTurno.addEventListener('submit', guardarTurno);
    }

    // Escuchador para autocompletar paciente mediante la cédula
    const inputTurnCedula = document.getElementById('turnCedula');
    if (inputTurnCedula) {
        inputTurnCedula.addEventListener('blur', (e) => buscarPacienteParaTurno(e.target.value.trim()));
    }
});

// --- FUNCIONES DE BASE DE DATOS (API REST) ---

// 1. Obtener los turnos desde la base de datos
async function cargarTurnosDB() {
    const inputFecha = document.getElementById('fecha-agenda');
    const fechaSeleccionada = inputFecha ? inputFecha.value : new Date().toISOString().split('T')[0];

    try {
        // Se envía la acción listar y la fecha seleccionada al Servlet/Controlador
        const response = await fetch(`./ControladorTurnos?accion=listar&fecha=${fechaSeleccionada}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const turnosDB = await response.json();

        if (Array.isArray(turnosDB)) {
            // Mapeo directo adaptado a las columnas de MySQL (turnos_podologia)
            turnos = turnosDB.map(t => ({
                id: t.id ? t.id.toString() : '',
                cedula: t.cedula || '',
                nombres: t.nombres || '',
                celular: t.celular || '',
                email: t.email || '',
                motivo: t.motivo || '',
                fecha: t.fecha || '',
                hora: t.hora_inicio || t.horaInicio || '',
                duracion: t.duracion_minutos || t.duracionMinutos || 50
            }));

            renderizarCalendario();
        }
    } catch (error) {
        console.error("Error al obtener los turnos desde Railway:", error);
    }
}

// 2. Guardar o actualizar un turno en MySQL
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
    const duracion = document.getElementById('duracion-minutos')?.value || '50';

    if (!cedula || !fecha || !hora) {
        alert("La Cédula, Fecha y Hora son campos requeridos.");
        return;
    }

    // Validar capacidad localmente (Límite máximo 3 por bloque horario)
    const turnosEnHora = turnos.filter(t => t.fecha === fecha && t.hora.startsWith(hora.substring(0,5)) && t.id !== idTurno);
    if (turnosEnHora.length >= 3 && !idTurno) {
        alert('No se pueden agendar más de 3 pacientes en el mismo bloque horario.');
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
            alert("¡Turno guardado exitosamente!");
            cerrarModal();
            cargarTurnosDB(); // Recargar datos de la BD
        } else {
            const data = await response.json().catch(() => ({}));
            alert("Atención: " + (data.error || "No se pudo agendar el turno."));
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        alert("Error de conexión al guardar el turno.");
    }
}

// 3. Eliminar / Cancelar un turno en MySQL
async function cancelarTurno(id) {
    if (!confirm('¿Desea cancelar este turno?')) return;

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
            alert("Turno eliminado correctamente.");
            cargarTurnosDB();
        } else {
            const data = await response.json().catch(() => ({}));
            alert("Atención: " + (data.error || "No se pudo eliminar el turno."));
        }
    } catch (error) {
        console.error("Error al cancelar turno:", error);
        alert("Error de conexión al eliminar.");
    }
}

// --- LÓGICA DE INTERFAZ DE AGENDA (CALENDARIO Y MODAL) ---

function obtenerIntervalos30Min() {
    const horarios = [];
    for (let h = 8; h <= 21; h++) {
        const horaStr = h < 10 ? `0${h}` : `${h}`;
        horarios.push(`${horaStr}:00`);
        if (h < 21) horarios.push(`${horaStr}:30`);
    }
    return horarios;
}

function cambiarDia(offset) {
    const inputFecha = document.getElementById('fecha-agenda');
    if (!inputFecha) return;
    
    const fechaActual = new Date(inputFecha.value + 'T00:00:00');
    fechaActual.setDate(fechaActual.getDate() + offset);
    
    inputFecha.value = fechaActual.toISOString().split('T')[0];
    cargarTurnosDB(); // Carga los turnos para la nueva fecha
}

function cargarOpcionesHorario() {
    const select = document.getElementById('hora-inicio');
    if (!select) return;
    select.innerHTML = '';
    obtenerIntervalos30Min().forEach(horaStr => {
        select.innerHTML += `<option value="${horaStr}">${horaStr}</option>`;
    });
}

function renderizarCalendario() {
    const inputFecha = document.getElementById('fecha-agenda');
    const cuerpo = document.getElementById('cuerpo-calendario');
    if (!inputFecha || !cuerpo) return;

    const fechaSeleccionada = inputFecha.value;
    cuerpo.innerHTML = '';

    obtenerIntervalos30Min().forEach(horaStr => {
        // Filtrar turnos del bloque
        const turnosEnHora = turnos.filter(t => t.fecha === fechaSeleccionada && t.hora.startsWith(horaStr.substring(0,5)));
        const numPacientes = turnosEnHora.length;
        const esMediaHora = horaStr.endsWith(':30');

        let alertaHtml = '';
        if (numPacientes >= 2) {
            alertaHtml = `<div class="alerta-cupo-pro" style="color: #d97706; font-size: 11px; margin-top: 4px;">⚠️ Ocupación múltiple: ${numPacientes} pacientes agendados.</div>`;
        }

        let tarjetasPacientes = turnosEnHora.map(t => {
            const mensajeTexto = `Saludos Sr/a ${t.nombres}, Recuerdo de Cita Médica en Podología a las ${t.hora.substring(0,5)} el día ${t.fecha}. Por favor acudir 10 minutos antes.`;
            const enlaceWS = `https://wa.me/${t.celular}?text=${encodeURIComponent(mensajeTexto)}`;

            let botonEmail = '';
            if (t.email && t.email.trim() !== '') {
                const asuntoEmail = encodeURIComponent("Recordatorio de Cita Médica - Podología");
                const enlaceEmail = `mailto:${t.email}?subject=${asuntoEmail}&body=${encodeURIComponent(mensajeTexto)}`;
                botonEmail = `<a href="${enlaceEmail}" class="btn-action btn-email-pro" title="Enviar Correo">✉️ Email</a>`;
            }

            return `
                <div class="paciente-card-pro ${numPacientes > 1 ? 'sobreocupado' : ''}" style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 6px 10px; margin-bottom: 6px; border-radius: 4px;">
                    <div class="paciente-info-pro">
                        <span class="nombre" style="font-weight: bold; font-size: 13px;">${t.nombres} <small style="font-weight:normal; color:#64748b">(CI: ${t.cedula})</small></span>
                        <div class="detalles" style="font-size: 12px; color: #334155;"><strong>Motivo:</strong> ${t.motivo} | <strong>Duración:</strong> ${t.duracion} min</div>
                    </div>
                    <div class="actions-group-pro" style="margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap;">
                        <a href="${enlaceWS}" target="_blank" class="btn-action btn-ws-pro" style="text-decoration:none; font-size:11px;" title="Enviar WhatsApp">📲 WhatsApp</a>
                        ${botonEmail}
                        <button type="button" class="btn-action btn-edit-pro" style="font-size:11px;" onclick="editarTurno('${t.id}')">✏️ Editar</button>
                        <button type="button" class="btn-action btn-danger-pro" style="font-size:11px;" onclick="cancelarTurno('${t.id}')">❌ Cancelar</button>
                    </div>
                </div>
            `;
        }).join('');

        cuerpo.innerHTML += `
            <tr class="${esMediaHora ? 'media-hora' : ''}">
                <td style="width: 120px; font-weight: bold; vertical-align: top;"><strong style="color:var(--text-main); font-size:14px;">${horaStr}</strong></td>
                <td>
                    ${tarjetasPacientes || '<span style="color: #94a3b8; font-style: italic; font-size: 13px;">Disponible</span>'}
                    ${alertaHtml}
                    ${numPacientes >= 3 ? '<span style="color:#b91c1c; font-size:11px; font-weight:bold;">(Límite de 3 pacientes alcanzado en esta hora)</span>' : ''}
                </td>
            </tr>
        `;
    });
}

function abrirModalNuevoTurno() {
    const modalTitulo = document.getElementById('modal-titulo');
    if (modalTitulo) modalTitulo.innerText = "Agendar Nueva Cita";
    
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
    if (modalTitulo) modalTitulo.innerText = "Editar Cita";

    if (document.getElementById('turno-id')) document.getElementById('turno-id').value = turno.id;
    if (document.getElementById('turnCedula')) document.getElementById('turnCedula').value = turno.cedula;
    if (document.getElementById('turnNombres')) document.getElementById('turnNombres').value = turno.nombres;
    if (document.getElementById('turnCelular')) document.getElementById('turnCelular').value = turno.celular;
    if (document.getElementById('turnEmail')) document.getElementById('turnEmail').value = turno.email || '';
    if (document.getElementById('turnMotivo')) document.getElementById('turnMotivo').value = turno.motivo;
    if (document.getElementById('modal-fecha')) document.getElementById('modal-fecha').value = turno.fecha;
    if (document.getElementById('hora-inicio')) document.getElementById('hora-inicio').value = turno.hora.substring(0,5);
    if (document.getElementById('duracion-minutos')) document.getElementById('duracion-minutos').value = turno.duracion;

    const modal = document.getElementById('modal-turno');
    if (modal) modal.style.display = 'flex';
}

// --- HERRAMIENTAS DE HISTORIA CLÍNICA (RESET Y PDF) ---

function resetForm() {
    if (window.confirm("¿Desea limpiar todos los campos del formulario y el lienzo?")) {
        const formContainer = document.getElementById('clinical-form');
        if (!formContainer) return;

        formContainer.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], input[type="number"], input[type="date"], textarea').forEach(input => input.value = '');
        formContainer.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => input.checked = false);
        
        const hcFecha = document.getElementById('hcFecha');
        if (hcFecha) hcFecha.valueAsDate = new Date();
        
        // Reset previews de imágenes si existen
        const piePreview = document.getElementById('pie-preview-img');
        const piePlaceholder = document.getElementById('pie-placeholder');
        if (piePreview && piePlaceholder) {
            piePreview.classList.add('hidden');
            piePlaceholder.classList.remove('hidden');
            document.getElementById('pie-image-input').value = '';
        }

        const pisadaPreview = document.getElementById('pisada-preview-img');
        const pisadaPlaceholder = document.getElementById('pisada-placeholder');
        if (pisadaPreview && pisadaPlaceholder) {
            pisadaPreview.classList.add('hidden');
            pisadaPlaceholder.classList.remove('hidden');
            document.getElementById('pisada-image-input').value = '';
        }
        
        if (typeof clearCanvas === 'function') {
            clearCanvas();
        }
    }
}



// Función auxiliar para convertir DD/MM/YYYY a YYYY-MM-DD
function formatearFechaISO(fechaStr) {
    if (!fechaStr) return '';
    
    // Si ya viene en formato YYYY-MM-DD (por ejemplo desde <input type="date">)
    if (fechaStr.includes('-')) return fechaStr;

    // Si viene en formato DD/MM/YYYY o DD-MM-YYYY
    const partes = fechaStr.split('/');
    if (partes.length === 3) {
        const [dia, mes, anio] = partes;
        return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    return fechaStr;
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
