// --- GESTIÓN DE TURNOS Y HISTORIA CLÍNICA PODOLÓGICA (MYSQL / RAILWAY) ---

let turnos = [];

// Inicialización de eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha de agenda al día actual
    const hoy = new Date().toISOString().split('T')[0];
    const fechaAgendaInput = document.getElementById('fecha-agenda');
    if (fechaAgendaInput) fechaAgendaInput.value = hoy;

    cargarOpcionesHorario();
    cargarTurnosDB(); // Carga inicial desde Railway

    const formTurno = document.getElementById('form-turno');
    if (formTurno) {
        // Asegurarse de que no haya múltiples event listeners
        formTurno.removeEventListener('submit', guardarTurno);
        formTurno.addEventListener('submit', guardarTurno);
    }
});

// --- FUNCIONES DE BASE DE DATOS (API REST) ---

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
    const fecha = document.getElementById('fecha-agenda')?.value;
    const hora = document.getElementById('hora-inicio')?.value;
    const duracion = document.getElementById('duracion-minutos')?.value || '40'; // Corregido ID

    if (!cedula || !fecha || !hora) {
        alert("La Cédula, Fecha y Hora son campos requeridos.");
        return;
    }

    // Validar capacidad localmente antes de enviar a DB (Límite 3)
    const turnosEnHora = turnos.filter(t => t.fecha === fecha && t.hora === hora && t.id !== idTurno);
    if (turnosEnHora.length >= 3 && !idTurno) {
        alert('No se pueden agendar más de 3 pacientes en el mismo bloque horario.');
        return;
    }

    try {
        const formData = new URLSearchParams();
        if (idTurno) formData.append("id", idTurno); // Si es actualización
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
            cerrarModal();
            cargarTurnosDB(); // Recargar datos frescos de la BD
        } else {
            const data = await response.json();
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
    
    const nuevaFechaStr = fechaActual.toISOString().split('T')[0];
    inputFecha.value = nuevaFechaStr;
    renderizarCalendario();
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
        const turnosEnHora = turnos.filter(t => t.fecha === fechaSeleccionada && t.hora.startsWith(horaStr.substring(0,5))); // Comparación segura de hora
        const numPacientes = turnosEnHora.length;
        const esMediaHora = horaStr.endsWith(':30');

        let alertaHtml = '';
        if (numPacientes >= 2) {
            alertaHtml = `<div class="alerta-cupo-pro">⚠️ Ocupación múltiple: ${numPacientes} pacientes agendados.</div>`;
        }

        let tarjetasPacientes = turnosEnHora.map(t => {
            const mensajeTexto = `Saludos Sr/a ${t.nombres}, Recuerdo de Cita Medica en Podología a las ${t.hora} el dia ${t.fecha} debe acudir 10 minutos antes para la preparación y evaluación`;
            const enlaceWS = `https://wa.me/${t.celular}?text=${encodeURIComponent(mensajeTexto)}`;

            let botonEmail = '';
            if (t.email && t.email.trim() !== '') {
                const asuntoEmail = encodeURIComponent("Recordatorio de Cita Médica - Podología");
                const enlaceEmail = `mailto:${t.email}?subject=${asuntoEmail}&body=${encodeURIComponent(mensajeTexto)}`;
                botonEmail = `<a href="${enlaceEmail}" class="btn-action btn-email-pro" title="Enviar Correo">✉️ Email</a>`;
            }

            return `
                <div class="paciente-card-pro ${numPacientes > 1 ? 'sobreocupado' : ''}">
                    <div class="paciente-info-pro">
                        <span class="nombre">${t.nombres} <small style="font-weight:normal; color:var(--text-muted)">(CI: ${t.cedula})</small></span>
                        <div class="detalles"><strong>Motivo:</strong> ${t.motivo} | <strong>Duración:</strong> ${t.duracion} min</div>
                    </div>
                    <div class="actions-group-pro">
                        <a href="${enlaceWS}" target="_blank" class="btn-action btn-ws-pro" title="Enviar WhatsApp">📲 WhatsApp</a>
                        ${botonEmail}
                        <button type="button" class="btn-action btn-edit-pro" onclick="editarTurno('${t.id}')">✏️ Editar</button>
                        <button type="button" class="btn-action btn-danger-pro" onclick="cancelarTurno('${t.id}')">❌ Cancelar</button>
                    </div>
                </div>
            `;
        }).join('');

        cuerpo.innerHTML += `
            <tr class="${esMediaHora ? 'media-hora' : ''}">
                <td><strong style="color:var(--text-main); font-size:14px;">${horaStr}</strong></td>
                <td>
                    ${tarjetasPacientes}
                    ${alertaHtml}
                    ${numPacientes >= 3 ? '<span style="color:#b91c1c; font-size:11px; font-weight:bold;">(Límite de 3 pacientes alcanzado en esta hora)</span>' : ''}
                </td>
            </tr>
        `;
    });
}

function abrirModalNuevoTurno() {
    document.getElementById('modal-titulo').innerText = "Agendar Nueva Cita";
    document.getElementById('turno-id').value = '';
    const form = document.getElementById('form-turno');
    if(form) form.reset();
    
    // Setear la fecha del modal con la fecha actual del calendario
    const fechaCalendario = document.getElementById('fecha-agenda')?.value;
    if (fechaCalendario && document.getElementById('modal-fecha')) {
         document.getElementById('modal-fecha').value = fechaCalendario;
    }

    document.getElementById('modal-turno').style.display = 'flex';
}

function cerrarModal() {
    const modal = document.getElementById('modal-turno');
    if (modal) modal.style.display = 'none';
}

function editarTurno(id) {
    const turno = turnos.find(t => t.id === id || t.id === id.toString());
    if (!turno) return;

    document.getElementById('modal-titulo').innerText = "Editar Cita";
    document.getElementById('turno-id').value = turno.id;
    document.getElementById('turnCedula').value = turno.cedula;
    document.getElementById('turnNombres').value = turno.nombres;
    document.getElementById('turnCelular').value = turno.celular;
    document.getElementById('turnEmail').value = turno.email || '';
    document.getElementById('turnMotivo').value = turno.motivo;
    document.getElementById('hora-inicio').value = turno.hora.substring(0,5); // Asegurar formato HH:MM
    document.getElementById('duracion-minutos').value = turno.duracion;

    document.getElementById('modal-turno').style.display = 'flex';
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

async function descargarPDFH() {
    const elemento = document.getElementById('clinical-form');
    if (!elemento) return;

    if (typeof html2pdf !== 'undefined') {
        const cedula = document.getElementById('hcCedula')?.value.trim() || 'SIN_CEDULA';
        const nombreCompleto = document.getElementById('hcNombres')?.value.trim() || 'SIN_NOMBRE';
        const nombreFormateado = nombreCompleto.replace(/\s+/g, '_').toUpperCase();
        const fecha = new Date().toISOString().split('T')[0];
        const nombreArchivo = `${cedula}_${nombreFormateado}_${fecha}.pdf`;

        // 1. Crear un contenedor temporal aislado
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.left = '-9999px';
        wrapper.style.top = '0';
        wrapper.style.width = '800px';
        wrapper.style.backgroundColor = '#ffffff';
        wrapper.style.padding = '0px';
        wrapper.style.margin = '0px';

        // 2. Clonar el formulario
        const clon = elemento.cloneNode(true);
        clon.style.width = '800px';
        clon.style.margin = '0 auto';
        clon.style.boxSizing = 'border-box';
        
        wrapper.appendChild(clon);
        document.body.appendChild(wrapper);

        const opciones = {
            margin:       [6, 6, 6, 6],
            filename:     nombreArchivo,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                x: 0,
                y: 0,
                scrollX: 0,
                scrollY: 0,
                width: 800,
                windowWidth: 800
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };

        try {
            // 3. Generar PDF
            await html2pdf().set(opciones).from(clon).save();
        } finally {
            // 4. Limpieza del DOM
            document.body.removeChild(wrapper);
        }
    } else {
        window.print();
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
