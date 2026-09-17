document.addEventListener("DOMContentLoaded", () => {
    const inputFecha = document.getElementById("fecha-agenda");
    if (inputFecha) {
        inputFecha.value = new Date().toISOString().split("T")[0];
        renderizarCalendario();
    }
    poblarHorasSelect();
});

// Genera las opciones dentro del <select id="hora-inicio">
function poblarHorasSelect() {
    const selectHora = document.getElementById("hora-inicio");
    if (!selectHora) return;
    selectHora.innerHTML = "";
    
    for (let h = 8; h <= 18; h++) {
        ["00", "30"].forEach(min => {
            if (h === 18 && min === "30") return;
            const horaStr = `${String(h).padStart(2, '0')}:${min}`;
            const option = document.createElement("option");
            option.value = horaStr;
            option.textContent = horaStr;
            selectHora.appendChild(option);
        });
    }
}

function cambiarDia(offset) {
    const inputFecha = document.getElementById("fecha-agenda");
    if (!inputFecha || !inputFecha.value) return;
    
    let fecha = new Date(inputFecha.value + "T00:00:00");
    fecha.setDate(fecha.getDate() + offset);
    inputFecha.value = fecha.toISOString().split("T")[0];
    renderizarCalendario();
}

function renderizarCalendario() {
    const inputFecha = document.getElementById("fecha-agenda");
    const cuerpo = document.getElementById("cuerpo-calendario");
    if (!cuerpo || !inputFecha || !inputFecha.value) return;

    fetch(`../ControladorTurnos?fecha=${inputFecha.value}`)
        .then(res => res.json())
        .then(turnos => {
            cuerpo.innerHTML = "";
            
            for (let h = 8; h <= 18; h++) {
                ["00", "30"].forEach(min => {
                    if (h === 18 && min === "30") return;
                    const horaDisplay = `${String(h).padStart(2, '0')}:${min}`;
                    
                    const turnosBloque = turnos.filter(t => t.horaInicio && t.horaInicio.startsWith(horaDisplay));
                    
                    let htmlPacientes = turnosBloque.map(t => `
                        <div class="paciente-card-pro">
                            <div class="paciente-info-pro">
                                <span class="nombre">${t.nombres}</span>
                                <span class="detalles">C.I: ${t.cedula} | ${t.motivo || 'Consulta'} | ${t.duracionMinutos} min</span>
                            </div>
                            <div class="actions-group-pro">
                                <button class="btn-action btn-danger-pro" onclick="eliminarTurno(${t.id})">Eliminar</button>
                            </div>
                        </div>
                    `).join("");

                    cuerpo.innerHTML += `
                        <tr class="${min === '30' ? 'media-hora' : ''}">
                            <td style="font-weight: 600;">${horaDisplay}</td>
                            <td>${htmlPacientes || '<span style="color: #cbd5e1; font-size: 12px;">Disponible</span>'}</td>
                        </tr>
                    `;
                });
            }
        })
        .catch(err => console.error("Error al cargar la agenda:", err));
}

// Abrir y cerrar con los IDs de tu HTML
function abrirModal() {
    const modal = document.getElementById("modal-turno");
    const inputFechaAgenda = document.getElementById("fecha-agenda");
    const inputFechaModal = document.getElementById("modal-fecha");
    
    if (modal) modal.style.display = "flex";
    if (inputFechaAgenda && inputFechaModal) {
        inputFechaModal.value = inputFechaAgenda.value;
    }
    document.getElementById("turno-id").value = "";
}

function cerrarModal() {
    const modal = document.getElementById("modal-turno");
    if (modal) modal.style.display = "none";
    document.getElementById("form-turno").reset();
}

function guardarTurno(e) {
    e.preventDefault();

    const params = new URLSearchParams({
        id: document.getElementById("turno-id").value,
        cedula: document.getElementById("turnCedula").value,
        nombres: document.getElementById("turnNombres").value,
        celular: document.getElementById("turnCelular").value,
        email: document.getElementById("turnEmail").value,
        fecha: document.getElementById("modal-fecha").value,
        hora_inicio: document.getElementById("hora-inicio").value,
        duracion_minutos: document.getElementById("duracion-minutos").value,
        motivo: document.getElementById("turnMotivo").value
    });

    fetch("../ControladorTurnos", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "OK") {
            cerrarModal();
            renderizarCalendario();
        } else {
            alert(data.error || "Error al guardar el turno.");
        }
    })
    .catch(err => console.error("Error:", err));
}

function eliminarTurno(id) {
    if (!confirm("¿Desea cancelar este turno?")) return;

    fetch("../ControladorTurnos", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ accion: "eliminar", id: id })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "OK") {
            renderizarCalendario();
        } else {
            alert(data.error || "No se pudo eliminar.");
        }
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
