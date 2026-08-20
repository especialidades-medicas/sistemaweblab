// --- VARIABLES GLOBALES SEGURAS ---
if (typeof entries === 'undefined') {
    var entries = JSON.parse(localStorage.getItem("lab_cotizaciones")) || [];
}
if (typeof patients === 'undefined') {
    var patients = JSON.parse(localStorage.getItem("lab_pacientes")) || [];
}

// --- FUNCIÓN AUXILIAR PARA ALERTAS ---
function mostrarAlerta(titulo, mensaje, tipo) {
    alert(`${titulo.toUpperCase()}: ${mensaje}`);
}

// --- GESTIÓN DE PESTAÑAS (SWITCH TAB UNIFICADO) ---
function switchTab(event, viewId) {
    if (event && event.preventDefault) event.preventDefault();
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
    
    document.querySelectorAll('.section-view').forEach(view => {
        view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }

    if (viewId === 'pacientes-view' || viewId === 'registro-view') {
        renderPatients();
    }
}

// --- MENÚ LATERAL Y BÚSQUEDA ---
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function toggleSidebarMobile() {
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
}

function buscarPaciente() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    const query = searchInput.value.trim();
    if(query) {
        alert("Buscando paciente por cédula o apellidos: " + query);
    } else {
        alert("Por favor ingrese un número de cédula o apellido para buscar.");
    }
}

// --- COTIZADOR DE EXÁMENES ---
function generateInitialsId(name) {
    const cleanName = name.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ ]/g, "").trim();
    const words = cleanName.split(/\s+/);
    let initials = words.map(w => w.charAt(0).toUpperCase()).join('');
    if (!initials) initials = "EX";
    
    let baseId = initials;
    let counter = 1;
    while (entries.some(e => e.id === initials)) {
        counter++;
        initials = baseId + counter;
    }
    return initials;
}

function saveEntry() {
    const itemInput = document.getElementById("item");
    const qtyInput = document.getElementById("qty");
    const priceInput = document.getElementById("price");
    
    if (!itemInput || !qtyInput || !priceInput) return;

    const itemName = itemInput.value.trim();
    const qty = parseInt(qtyInput.value);
    const price = parseFloat(priceInput.value);
    
    const editIndexEl = document.getElementById("editIndex");
    const editIndex = editIndexEl ? parseInt(editIndexEl.value) : -1;

    if (!itemName || isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
        alert("Por favor complete todos los campos correctamente.");
        return;
    }

    if (editIndex !== -1) {
        entries[editIndex].item = itemName;
        entries[editIndex].qty = qty;
        entries[editIndex].price = price;
        entries[editIndex].total = qty * price;
        if (editIndexEl) editIndexEl.value = "-1";
        const saveBtn = document.getElementById("saveBtn");
        if (saveBtn) saveBtn.innerText = "Agregar Examen";
    } else {
        const existingIndex = entries.findIndex(e => e.item.toLowerCase() === itemName.toLowerCase());

        if (existingIndex !== -1) {
            entries[existingIndex].qty += qty;
            entries[existingIndex].price = price;
            entries[existingIndex].total = entries[existingIndex].qty * price;
            alert(`El examen "${itemName}" ya estaba en la lista. Se ha actualizado sumando la cantidad.`);
        } else {
            const generatedId = generateInitialsId(itemName);
            entries.push({ id: generatedId, item: itemName, qty, price, total: qty * price });
        }
    }

    persistData();
    renderTable();
    clearForm();
}

function renderTable() {
    const tbody = document.getElementById("entryList");
    if (!tbody) return; 
    
    tbody.innerHTML = "";
    let grandTotal = 0;

    entries.forEach((entry, index) => {
        grandTotal += entry.total;
        if (!entry.id) {
            entry.id = generateInitialsId(entry.item);
        }

        const row = tbody.insertRow();
        row.innerHTML = `
            <td><span class="badge-id">${entry.id}</span></td>
            <td>${entry.item}</td>
            <td>${entry.qty}</td>
            <td>$${entry.price.toFixed(2)}</td>
            <td>$${entry.total.toFixed(2)}</td>
            <td>
                <button class="btn-edit" onclick="editEntry(${index})">Editar</button>
                <button class="btn-delete" onclick="deleteEntry(${index})">Eliminar</button>
            </td>
        `;
    });

    const grandTotalElem = document.getElementById("grandTotal");
    if (grandTotalElem) grandTotalElem.innerText = "$" + grandTotal.toFixed(2);
}

function editEntry(index) {
    const entry = entries[index];
    if (!entry) return;
    if (document.getElementById("item")) document.getElementById("item").value = entry.item;
    if (document.getElementById("qty")) document.getElementById("qty").value = entry.qty;
    if (document.getElementById("price")) document.getElementById("price").value = entry.price;
    if (document.getElementById("editIndex")) document.getElementById("editIndex").value = index;
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) saveBtn.innerText = "Actualizar Examen";
}

function deleteEntry(index) {
    entries.splice(index, 1);
    persistData();
    renderTable();
}

function clearAllData() {
    if(confirm("¿Está seguro de borrar todas las cotizaciones guardadas?")) {
        entries = [];
        localStorage.removeItem("lab_cotizaciones");
        renderTable();
    }
}

function persistData() {
    localStorage.setItem("lab_cotizaciones", JSON.stringify(entries));
}

function clearForm() {
    if (document.getElementById("item")) document.getElementById("item").value = "";
    if (document.getElementById("qty")) document.getElementById("qty").value = "1";
    if (document.getElementById("price")) document.getElementById("price").value = "";
    if (document.getElementById("editIndex")) document.getElementById("editIndex").value = "-1";
    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) saveBtn.innerText = "Agregar Examen";
}

// --- EXCEL COTIZACIONES ---
function exportToExcel() {
    if (entries.length === 0) {
        alert("No hay exámenes en la cotización para exportar.");
        return;
    }

    const dataToExport = entries.map(e => ({
        "ID": e.id,
        "Examen / Perfil": e.item,
        "Cantidad": e.qty,
        "Precio Unitario ($)": e.price,
        "Total Parcial ($)": e.total
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cotizacion_Laboratorio");
    XLSX.writeFile(workbook, "Cotizacion_Examenes.xlsx");
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonSheet = XLSX.utils.sheet_to_json(worksheet);

            if (jsonSheet.length === 0) {
                alert("El archivo Excel está vacío.");
                return;
            }

            jsonSheet.forEach(row => {
                const itemName = String(row["Examen / Perfil"] || row["Item"] || row["item"] || "Examen sin nombre").trim();
                const qty = parseInt(row["Cantidad"] || row["Qty"] || row["qty"]) || 1;
                const price = parseFloat(row["Precio Unitario ($)"] || row["Price"] || row["price"]) || 0;
                const total = qty * price;

                const existingIndex = entries.findIndex(e => e.item.toLowerCase() === itemName.toLowerCase());
                if (existingIndex !== -1) {
                    entries[existingIndex].qty += qty;
                    entries[existingIndex].price = price;
                    entries[existingIndex].total = entries[existingIndex].qty * price;
                } else {
                    const generatedId = generateInitialsId(itemName);
                    entries.push({ id: generatedId, item: itemName, qty, price, total });
                }
            });

            persistData();
            renderTable();
            alert("¡Exámenes importados con éxito!");
        } catch (error) {
            alert("Error al leer el archivo Excel.");
            console.error(error);
        } finally {
            event.target.value = ""; 
        }
    };
    reader.readAsArrayBuffer(file);
}

// --- REGISTRO Y GESTIÓN DE PACIENTES (MYSQL) ---
async function savePatient(event) {
    if (event) event.preventDefault();

    const cedula = document.getElementById("patCedula")?.value.trim();
    const nombre = document.getElementById("patNombre")?.value.trim().toUpperCase();
    
    if (!cedula || !nombre) {
        alert("Por favor complete los campos obligatorios: Cédula y Nombres.");
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("patCedula", cedula);
        formData.append("patNombre", nombre);
        formData.append("patNacimiento", document.getElementById("patNacimiento")?.value || "");
        formData.append("patGenero", document.getElementById("patGenero")?.value || "");
        formData.append("patTelefono", document.getElementById("patTelefono")?.value.trim() || "");
        formData.append("patCorreo", document.getElementById("patCorreo")?.value.trim().toLowerCase() || "");
        formData.append("patDireccion", document.getElementById("patDireccion")?.value.trim() || "");

        const response = await fetch('/sistemaLaboratorio/ControladorPacientes', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const resultadoTexto = await response.text();

        if (response.ok) {
            alert("¡Operación exitosa! Los datos del paciente han sido guardados o actualizados correctamente.");
            renderPatients(); 
            resetPatientForm();
        } else {
            alert("Atención: " + resultadoTexto);
        }

    } catch (error) {
        console.error("Error en el proceso de guardado:", error);
        alert("Error de conexión al procesar el paciente.");
    }
}

async function renderPatients() {
    const tbody = document.getElementById("patientTableBody");
    if (!tbody) return;

    try {
        const response = await fetch('/sistemaLaboratorio/ControladorPacientes');
        const text = await response.text();

        let patientsDB = [];
        try {
            patientsDB = JSON.parse(text);
        } catch (e) {
            console.error("El servidor no devolvió un JSON válido:", text);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Error en el formato de datos del servidor.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        if (!patientsDB || patientsDB.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--gray);">No hay pacientes registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = patientsDB.map((patient) => `
            <tr>
                <td>${patient.cedula || ''}</td>
                <td>${patient.nombres || ''}</td>
                <td>${patient.fechaNacimiento || ''}</td>
                <td>${patient.genero || ''}</td>
                <td>${patient.telefono || ''}</td>
                <td>${patient.correo || ''}</td>
                <td>${patient.direccion || ''}</td>
                <td>
                    <button type="button" class="btn-action" onclick="editarPacienteBD('${patient.cedula}')" style="padding: 4px 8px; font-size: 0.85rem;">Editar</button>
                    <button type="button" class="btn-delete" onclick="eliminarPacienteBD('${patient.cedula}')" style="padding: 4px 8px; font-size: 0.85rem;">Eliminar</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Error al cargar los pacientes:", error);
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Error de conexión al cargar pacientes.</td></tr>`;
    }
}

function resetPatientForm() {
    if (document.getElementById("patCedula")) document.getElementById("patCedula").value = "";
    if (document.getElementById("patNombre")) document.getElementById("patNombre").value = "";
    if (document.getElementById("patNacimiento")) document.getElementById("patNacimiento").value = "";
    if (document.getElementById("patGenero")) document.getElementById("patGenero").value = "Masculino";
    if (document.getElementById("patTelefono")) document.getElementById("patTelefono").value = "";
    if (document.getElementById("patCorreo")) document.getElementById("patCorreo").value = "";
    if (document.getElementById("patDireccion")) document.getElementById("patDireccion").value = "";
    if (document.getElementById("editPatientIndex")) document.getElementById("editPatientIndex").value = "-1";
    if (document.getElementById("patientFormTitle")) document.getElementById("patientFormTitle").innerText = "Nuevo Registro de Paciente";
    if (document.getElementById("btnSavePatient")) document.getElementById("btnSavePatient").innerText = "Guardar";
    if (document.getElementById("btnCancelPatient")) document.getElementById("btnCancelPatient").style.display = "none";
}

// --- BÚSQUEDAS AUTOMÁTICAS EN BD ---
async function buscarPacientePorCedulaDB(cedula) {
    if (!cedula || cedula.length < 5) return; 
    
    try {
        const response = await fetch(`/sistemaLaboratorio/ControladorPacientes?accion=buscar&cedula=${cedula}`);
        if (response.ok) {
            const paciente = await response.json();
            if (paciente && document.getElementById('patNombre')) {
                document.getElementById('patNombre').value = paciente.nombres || '';
                document.getElementById('patNacimiento').value = paciente.fechaNacimiento || '';
                document.getElementById('patGenero').value = paciente.genero || 'Masculino';
                document.getElementById('patTelefono').value = paciente.telefono || '';
                document.getElementById('patCorreo').value = paciente.correo || '';
                document.getElementById('patDireccion').value = paciente.direccion || '';
            }
        }
    } catch (error) {
        console.error("Error conectando con la base de datos:", error);
    }
}

async function editarPacienteBD(cedula) {
    try {
        const response = await fetch(`/sistemaLaboratorio/ControladorPacientes?accion=buscar&cedula=${cedula}`);
        if (response.ok) {
            const paciente = await response.json();
            if (paciente) {
                document.getElementById('patCedula').value = paciente.cedula || '';
                document.getElementById('patNombre').value = paciente.nombres || '';
                document.getElementById('patNacimiento').value = paciente.fechaNacimiento || '';
                document.getElementById('patGenero').value = paciente.genero || 'Masculino';
                document.getElementById('patTelefono').value = paciente.telefono || '';
                document.getElementById('patCorreo').value = paciente.correo || '';
                document.getElementById('patDireccion').value = paciente.direccion || '';
                
                const title = document.getElementById('patientFormTitle');
                if (title) title.innerText = "Actualizar Datos del Paciente";
                
                const btnSave = document.getElementById('btnSavePatient');
                if (btnSave) btnSave.innerText = "Guardar Cambios";
                
                const btnCancel = document.getElementById('btnCancelPatient');
                if (btnCancel) btnCancel.style.display = "inline-block";
                
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    } catch (error) {
        console.error("Error al cargar los datos para editar:", error);
        alert("No se pudo cargar la información del paciente.");
    }
}

async function eliminarPacienteBD(cedula) {
    if (!confirm(`¿Está seguro de eliminar al paciente con cédula ${cedula}?`)) return;

    try {
        const formData = new URLSearchParams();
        formData.append("accion", "eliminar");
        formData.append("cedula", cedula);

        const response = await fetch('/sistemaLaboratorio/ControladorPacientes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const resultado = await response.text();

        if (response.ok) {
            alert("Paciente eliminado correctamente.");
            renderPatients();
        } else {
            alert("Atención: " + resultado);
        }
    } catch (error) {
        console.error("Error al eliminar el paciente:", error);
        alert("Error de conexión al intentar eliminar.");
    }
}

async function buscarPacienteEnHistoriaClinica(cedula) {
    if (!cedula || cedula.length < 5) return;
    
    try {
        const response = await fetch(`/sistemaLaboratorio/ControladorPacientes?accion=buscar&cedula=${cedula}`);
        if (response.ok) {
            const paciente = await response.json();
            if (paciente) {
                // Rellenar datos del paciente
                if (document.getElementById('hcNombres')) document.getElementById('hcNombres').value = paciente.nombres || '';
                if (document.getElementById('hcNacimiento')) document.getElementById('hcNacimiento').value = paciente.fechaNacimiento || '';
                if (document.getElementById('hcSexo')) document.getElementById('hcSexo').value = paciente.genero || 'Masculino';
                if (document.getElementById('hcCelular')) document.getElementById('hcCelular').value = paciente.telefono || '';
                if (document.getElementById('hcEmail')) document.getElementById('hcEmail').value = paciente.correo || '';
                if (document.getElementById('hcDireccion')) document.getElementById('hcDireccion').value = paciente.direccion || '';
                
                // Cálculo automático de la edad usando la función modular
                if (document.getElementById('hcEdad')) {
                    document.getElementById('hcEdad').value = paciente.fechaNacimiento ? calcularEdad(paciente.fechaNacimiento) : '';
                }
            }
        }
    } catch (error) {
        console.error("Error al conectar con la base de datos para la historia clínica:", error);
    }
}


async function buscarPacienteEnCertificados(cedula) {
    if (!cedula || cedula.length < 5) return;
    
    try {
        const response = await fetch(`/sistemaLaboratorio/ControladorPacientes?accion=buscar&cedula=${cedula}`);
        if (response.ok) {
            const paciente = await response.json();
            if (paciente) {
                if (document.getElementById('certNombres')) document.getElementById('certNombres').value = paciente.nombres || '';
                if (document.getElementById('certDireccionDom')) document.getElementById('certDireccionDom').value = paciente.direccion || '';
                if (document.getElementById('certTelPaciente')) document.getElementById('certTelPaciente').value = paciente.telefono || '';
            }
        }
    } catch (error) {
        console.error("Error al conectar con la base de datos para el certificado:", error);
    }
}

// 1. Función para calcular la edad exacta en años
function calcularEdad(fechaNacimientoStr) {
    if (!fechaNacimientoStr) return '';

    let nac;
    if (fechaNacimientoStr.includes('/')) {
        // Formato DD/MM/YYYY (ejemplo: 15/08/2026)
        const partes = fechaNacimientoStr.split('/');
        nac = new Date(partes[2], partes[1] - 1, partes[0]);
    } else {
        // Formato YYYY-MM-DD (estándar HTML input date)
        const partes = fechaNacimientoStr.split('-');
        nac = new Date(partes[0], partes[1] - 1, partes[2]);
    }

    if (isNaN(nac.getTime())) return '';

    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) {
        edad--;
    }

    return edad >= 0 ? edad : 0;
}

// 2. Función para actualizar automáticamente el campo de edad en la interfaz
function actualizarCampoEdad(idFechaInput, idEdadInput) {
    const inputFecha = document.getElementById(idFechaInput);
    const inputEdad = document.getElementById(idEdadInput);

    if (inputFecha && inputEdad) {
        const edad = calcularEdad(inputFecha.value);
        inputEdad.value = edad !== '' ? edad : '';
    }
}



// --- INICIALIZACIÓN ÚNICA DE EVENTOS Y TABLAS AL CARGAR EL DOM ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar tablas iniciales
    renderTable();
    renderPatients();

    // 2. Input Pacientes (Cédula y Fecha de Nacimiento)
    const inputPatCedula = document.getElementById('patCedula');
    if (inputPatCedula) {
        inputPatCedula.addEventListener('blur', (e) => buscarPacientePorCedulaDB(e.target.value.trim()));
    }

    const inputPatNacimiento = document.getElementById('patNacimiento');
    if (inputPatNacimiento) {
        ['change', 'input', 'blur'].forEach(evento => {
            inputPatNacimiento.addEventListener(evento, () => actualizarCampoEdad('patNacimiento', 'patEdad'));
        });
    }

    // 3. Input Historia Clínica (Cédula y Fecha de Nacimiento)
    const inputHcCedula = document.getElementById('hcCedula');
    if (inputHcCedula) {
        inputHcCedula.addEventListener('blur', (e) => buscarPacienteEnHistoriaClinica(e.target.value.trim()));
    }

    const inputHcNacimiento = document.getElementById('hcNacimiento');
    if (inputHcNacimiento) {
        ['change', 'input', 'blur'].forEach(evento => {
            inputHcNacimiento.addEventListener(evento, () => actualizarCampoEdad('hcNacimiento', 'hcEdad'));
        });
    }

    // 4. Input Certificados
    const inputCertCedula = document.getElementById('certCedula');
    if (inputCertCedula) {
        inputCertCedula.addEventListener('blur', (e) => buscarPacienteEnCertificados(e.target.value.trim()));
        inputCertCedula.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarPacienteEnCertificados(e.target.value.trim());
            }
        });
    }
});


