const HORARIOS_AGENDA = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", 
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", 
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", 
    "20:00", "20:30", "21:00"
];

let turnosDelDia = [];
let enviandoFormulario = false;

document.addEventListener('DOMContentLoaded', () => {
    poblarHorasInicio();
    
    const fechaInput = document.getElementById('fecha-agenda');
    if (fechaInput && !fechaInput.value) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }

    if (fechaInput) {
        fechaInput.addEventListener('change', cargarTurnosDB);
    }

    const turnCedula = document.getElementById('turnCedula');
    if (turnCedula) {
        turnCedula.addEventListener('blur', (e) => buscarPacienteParaTurno(e.target.value.trim()));
    }

    const formTurno = document.getElementById('form-turno');
    if (formTurno) {
        formTurno.addEventListener('submit', guardarTurno);
    }

    cargarTurnosDB();
});

function poblarHorasInicio() {
    const select = document.getElementById('hora-inicio');
    if (!select) return;
    select.innerHTML = HORARIOS_AGENDA.map(h => `<option value="${h}">${h}</option>`).join('');
}

function cambiarDia(delta) {
    const input = document.getElementById('fecha-agenda');
    if (!input || !input.value) return;

    const fecha = new Date(input.value + 'T00:00:00');
    fecha.setDate(fecha.getDate() + delta);
    input.value = fecha.toISOString().split('T')[0];
    cargarTurnosDB();
}

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

async function cargarTurnosDB() {
    const tbody = document.getElementById('cuerpo-calendario');
    const inputFecha = document.getElementById('fecha-agenda');
    if (!inputFecha) return;

    const fechaSeleccionada = inputFecha.value;
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding: 20px;">Cargando agenda...</td></tr>';
    }

    try {
        const response = await fetch(`/ControladorTurnosFisioterapia?accion=listar&fecha=${encodeURIComponent(fechaSeleccionada)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const turnosDB = await response.json();

        if (Array.isArray(turnosDB)) {
            turnosDelDia = turnosDB.map(t => ({
                id: t.id,
                cedula: t.cedula || '',
                nombres: t.nombres || '',
                celular: t.celular || '',
                email: t.email || '',
                motivo: t.motivo || '',
                fecha: t.fecha || fechaSeleccionada,
                horaInicio: t.hora_inicio || t.horaInicio || '',
                duracionMinutos: t.duracion_minutos || t.duracionMinutos || 30
            }));
        } else {
            turnosDelDia = [];
        }

        renderizarCalendario();

    } catch (error) {
        console.error("Error al obtener los turnos:", error);
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:red; padding: 20px;">Error al cargar los turnos agendados.</td></tr>';
        }
    }
}

function renderizarCalendario() {
    const tbody = document.getElementById('cuerpo-calendario');
    if (!tbody) return;

    tbody.innerHTML = '';

    const inputFecha = document.getElementById('fecha-agenda');
    const fechaSeleccionada = inputFecha ? inputFecha.value : '';
    
    let fechaTexto = fechaSeleccionada;
    if (fechaSeleccionada && fechaSeleccionada.includes('-')) {
        const [anio, mes, dia] = fechaSeleccionada.split('-');
        fechaTexto = `${dia}/${mes}/${anio}`;
    }

    HORARIOS_AGENDA.forEach(hora => {
        const turnosEnBloque = turnosDelDia.filter(t => t.horaInicio === hora);
        const tr = document.createElement('tr');

        let tarjetasHTML = turnosEnBloque.map(t => {
            let celularLimpio = t.celular ? t.celular.replace(/\D/g, '') : '';
            if (celularLimpio.startsWith('0') && celularLimpio.length === 10) {
                celularLimpio = '593' + celularLimpio.substring(1);
            }

            const fechaCita = fechaTexto || t.fecha || '';
            const mensajeWA = encodeURIComponent(`Hola saludos ${t.nombres}, le recordamos su cita de Fisioterapia programada para el ${fechaCita} a las ${t.horaInicio}.`);
            
            const botonWhatsApp = celularLimpio ? `
                <a href="https://wa.me/${celularLimpio}?text=${mensajeWA}" 
                   target="_blank" 
                   class="btn-action btn-ws-pro" 
                   style="padding: 3px 8px; font-size: 0.8rem; background-color: #25D366; color: white; text-decoration: none; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;" 
                   title="Enviar recordatorio por WhatsApp">
                    📲 WhatsApp
                </a>
            ` : '';

            return `
                <div class="card-turno-pro" style="background:#e0f2fe; border-left: 4px solid #0284c7; padding: 8px 12px; margin-bottom: 6px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${t.nombres}</strong> <small>(${t.cedula})</small><br>
                        <span style="font-size: 0.85rem; color: #334155;">Motivo: ${t.motivo} | Tel: ${t.celular}</span><br>
                        <span style="font-size: 0.75rem; background: #bae6fd; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${t.duracionMinutos} min</span>
                    </div>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        ${botonWhatsApp}
                        <button type="button" class="btn-action" onclick="editarTurno(${t.id})" style="padding: 3px 8px; font-size: 0.8rem;">Editar</button>
                        <button type="button" class="btn-delete" onclick="eliminarTurno(${t.id})" style="padding: 3px 8px; font-size: 0.8rem;">Eliminar</button>
                    </div>
                </div>
            `;
        }).join('');

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
            <td style="font-weight: bold; color: #475569; vertical-align: top; width: 100px;">${hora}</td>
            <td>
                ${tarjetasHTML}
                ${botonAgregar}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalNuevoTurno(horaInicio = '08:00') {
    const form = document.getElementById('form-turno');
    if (form) form.reset();
    
    const turnoId = document.getElementById('turno-id');
    if (turnoId) turnoId.value = '';

    const titulo = document.getElementById('modal-titulo');
    if (titulo) titulo.innerText = 'Agendar Nueva Cita';

    const selectHora = document.getElementById('hora-inicio');
    if (selectHora) selectHora.value = horaInicio;
    
    const fechaAgenda = document.getElementById('fecha-agenda')?.value;
    const fechaModal = document.getElementById('modal-fecha');
    if (fechaAgenda && fechaModal) {
        fechaModal.value = fechaAgenda;
    }

    const modal = document.getElementById('modal-turno');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

function cerrarModal() {
    const modal = document.getElementById('modal-turno');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

function editarTurno(id) {
    const turno = turnosDelDia.find(t => String(t.id) === String(id));
    if (!turno) return;

    if (document.getElementById('turno-id')) document.getElementById('turno-id').value = turno.id;
    if (document.getElementById('turnCedula')) document.getElementById('turnCedula').value = turno.cedula || '';
    if (document.getElementById('turnNombres')) document.getElementById('turnNombres').value = turno.nombres || '';
    if (document.getElementById('turnCelular')) document.getElementById('turnCelular').value = turno.celular || '';
    if (document.getElementById('turnEmail')) document.getElementById('turnEmail').value = turno.email || '';
    if (document.getElementById('turnMotivo')) document.getElementById('turnMotivo').value = turno.motivo || '';
    
    // 1. Panagpabaro ti fecha iti format a YYYY-MM-DD
    let fechaFormateada = turno.fecha || '';
    if (fechaFormateada.includes('T')) {
        fechaFormateada = fechaFormateada.split('T')[0];
    } else if (fechaFormateada.includes('/')) {
        const partes = fechaFormateada.split('/');
        if (partes.length === 3) {
            if (partes[0].length === 4) {
                fechaFormateada = `${partes[0]}-${partes[1].padStart(2, '0')}-${partes[2].padStart(2, '0')}`;
            } else {
                fechaFormateada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
            }
        }
    }

    if (document.getElementById('modal-fecha')) {
        document.getElementById('modal-fecha').value = fechaFormateada;
    }

    // 2. Panagkortar iti segundos ti hora_inicio (kas pagarigan: "08:00:00" -> "08:00")
    let horaInicio = turno.horaInicio || turno.hora_inicio || '';
    if (horaInicio.length > 5) {
        horaInicio = horaInicio.substring(0, 5);
    }

    const selectHora = document.getElementById('hora-inicio');
    if (selectHora) {
        // Panangisigurado a adda ti option ti select
        let existeOpcion = Array.from(selectHora.options).some(opt => opt.value === horaInicio);
        if (!existeOpcion && horaInicio) {
            const opt = document.createElement('option');
            opt.value = horaInicio;
            opt.textContent = horaInicio;
            selectHora.appendChild(opt);
        }
        selectHora.value = horaInicio;
    }

    if (document.getElementById('duracion-minutos')) {
        document.getElementById('duracion-minutos').value = turno.duracionMinutos || turno.duracion_min || '50';[cite: 10]
    }

    const titulo = document.getElementById('modal-titulo');
    if (titulo) titulo.innerText = 'Editar Cita Fisioterapia';

    const modal = document.getElementById('modal-turno');
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }
}

async function guardarTurno(event) {
    if (event) event.preventDefault();

    if (enviandoFormulario) return;

    const fechaModal = document.getElementById('modal-fecha')?.value;
    const fechaAgenda = document.getElementById('fecha-agenda')?.value;
    const fechaFinal = fechaModal || fechaAgenda;

    if (!fechaFinal) {
        alert("Seleccione una fecha válida para la cita.");
        return;
    }

    const idTurno = document.getElementById('turno-id')?.value || '';
    const esEdicion = idTurno.trim() !== '' && idTurno !== '0';
    const btnSubmit = document.querySelector('#form-turno button[type="submit"]');

    const params = new URLSearchParams();
    params.append('accion', esEdicion ? 'editar' : 'guardar');
    params.append('id', idTurno);
    params.append('turnCedula', document.getElementById('turnCedula')?.value.trim() || '');
    params.append('turnNombres', document.getElementById('turnNombres')?.value.trim() || '');
    params.append('turnCelular', document.getElementById('turnCelular')?.value.trim() || '');
    params.append('turnEmail', document.getElementById('turnEmail')?.value.trim() || '');
    params.append('turnMotivo', document.getElementById('turnMotivo')?.value.trim() || '');
    params.append('horaInicio', document.getElementById('hora-inicio')?.value || '08:00');
    params.append('duracionMinutos', document.getElementById('duracion-minutos')?.value || '30');
    
    // Enviar fecha bajo ambas denominaciones para evitar conflictos de nombres en el Backend
    params.append('fecha', fechaFinal);
    params.append('fechaTurno', fechaFinal);

    try {
        enviandoFormulario = true;
        if (btnSubmit) btnSubmit.disabled = true;

        const res = await fetch('/ControladorTurnosFisioterapia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: params.toString()
        });

        const data = await res.json();
        if (res.ok) {
            alert(esEdicion ? "Cita actualizada exitosamente." : "Cita agendada exitosamente.");
            cerrarModal();

            // Mover el selector de fecha principal al nuevo día seleccionado en la edición
            const inputAgenda = document.getElementById('fecha-agenda');
            if (inputAgenda) {
                inputAgenda.value = fechaFinal;
            }

            cargarTurnosDB();
        } else {
            alert("Atención: " + (data.error || "No se pudo guardar la cita."));
        }
    } catch (e) {
        console.error("Error al guardar el turno:", e);
        alert("Error de conexión al guardar la cita.");
    } finally {
        enviandoFormulario = false;
        if (btnSubmit) btnSubmit.disabled = false;
    }
}

async function eliminarTurno(id) {
    if (!confirm("¿Está seguro de que desea eliminar esta cita Fisioterapia?")) return;

    const params = new URLSearchParams();
    params.append('accion', 'eliminar');
    params.append('id', id);

    try {
        const res = await fetch('/ControladorTurnosFisioterapia', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: params.toString()
        });

        if (res.ok) {
            alert("Cita eliminada exitosamente.");
            cargarTurnosDB();
        } else {
            const data = await res.json();
            alert("Error: " + (data.error || "No se pudo eliminar el turno."));
        }
    } catch (e) {
        console.error("Error al eliminar el turno:", e);
        alert("Error de conexión al eliminar.");
    }
}

   
