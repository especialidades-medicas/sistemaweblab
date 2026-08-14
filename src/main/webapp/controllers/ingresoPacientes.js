// --- VARIABLES GLOBALES SEGURAS ---
if (typeof entries === 'undefined') {
    var entries = JSON.parse(localStorage.getItem("lab_cotizaciones")) || [];
}
if (typeof patients === 'undefined') {
    var patients = JSON.parse(localStorage.getItem("lab_pacientes")) || [];
}

// --- INICIALIZACIÓN ÚNICA AL CARGAR LA PÁGINA ---
window.onload = function() {
    renderTable();       // Carga el cotizador (si existe)
    renderPatients();    // Carga la tabla de pacientes al iniciar
};

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

    // Compatible con los distintos IDs de vistas de tus páginas ('pacientes-view' o 'registro-view')
    if (viewId === 'pacientes-view' || viewId === 'registro-view') {
        patients = JSON.parse(localStorage.getItem("lab_pacientes")) || [];
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

// --- REGISTRO Y GESTIÓN DE PACIENTES ---
function savePatient(event) {
    event.preventDefault();

    const cedulaInput = document.getElementById("patCedula");
    const nombreInput = document.getElementById("patNombre");
    
    if (!cedulaInput || !nombreInput) return;

    const cedula = cedulaInput.value.trim();
    // Nombres en MAYÚSCULAS automáticamente
    const nombre = nombreInput.value.trim().toUpperCase();
    
    const nacimiento = document.getElementById("patNacimiento") ? document.getElementById("patNacimiento").value : "";
    const genero = document.getElementById("patGenero") ? document.getElementById("patGenero").value : "";
    const telefono = document.getElementById("patTelefono") ? document.getElementById("patTelefono").value.trim() : "";
    
    // Correo en minúsculas automáticamente
    const correoInput = document.getElementById("patCorreo");
    const correo = correoInput ? correoInput.value.trim().toLowerCase() : "";
    
    const direccion = document.getElementById("patDireccion") ? document.getElementById("patDireccion").value.trim() : "";
    
    const editIndexEl = document.getElementById("editPatientIndex");
    const editIndex = editIndexEl ? parseInt(editIndexEl.value) : -1;

    // Validación estricta: Únicamente Cédula y Nombres son obligatorios
    if (!cedula || !nombre) {
        alert("Por favor complete los campos obligatorios: Cédula y Apellidos/Nombres.");
        return;
    }

    const nuevoPaciente = { cedula, nombre, nacimiento, genero, telefono, correo, direccion };

    if (editIndex !== -1) {
        patients[editIndex] = nuevoPaciente;
        alert("Paciente actualizado exitosamente.");
    } else {
        const exists = patients.some(p => p.cedula === cedula);
        if (exists) {
            alert("Ya existe un paciente registrado con este número de cédula.");
            return;
        }
        patients.push(nuevoPaciente);
        alert("Paciente registrado exitosamente.");
    }

    persistPatients();
    renderPatients();
    autoExportToExcel();
    resetPatientForm();
}

function renderPatients() {
    patients = JSON.parse(localStorage.getItem("lab_pacientes")) || [];
    const tbody = document.getElementById("patientTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (patients.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--gray);">No hay pacientes registrados.</td></tr>`;
        return;
    }

    patients.forEach((patient, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><span class="badge-id">${patient.cedula}</span></td>
            <td>${patient.nombre}</td>
            <td>${patient.telefono || 'N/A'}</td>
            <td>${patient.correo || 'N/A'}</td>
            <td>
                <button class="btn-edit" style="background: #f59e0b; color: white; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; margin-right: 5px;" onclick="editPatient(${index})">Editar</button>
                <button class="btn-delete" style="background: #ef4444; color: white; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem;" onclick="deletePatient(${index})">Eliminar</button>
            </td>
        `;
    });
}

function editPatient(index) {
    const p = patients[index];
    if (!p) return;
    
    if (document.getElementById("patCedula")) document.getElementById("patCedula").value = p.cedula;
    if (document.getElementById("patNombre")) document.getElementById("patNombre").value = p.nombre;
    if (document.getElementById("patNacimiento")) document.getElementById("patNacimiento").value = p.nacimiento;
    if (document.getElementById("patGenero")) document.getElementById("patGenero").value = p.genero;
    if (document.getElementById("patTelefono")) document.getElementById("patTelefono").value = p.telefono;
    if (document.getElementById("patCorreo")) document.getElementById("patCorreo").value = p.correo;
    if (document.getElementById("patDireccion")) document.getElementById("patDireccion").value = p.direccion;

    if (document.getElementById("editPatientIndex")) document.getElementById("editPatientIndex").value = index;
    if (document.getElementById("patientFormTitle")) document.getElementById("patientFormTitle").innerText = "Actualizar Datos del Paciente";
    if (document.getElementById("btnSavePatient")) document.getElementById("btnSavePatient").innerText = "Actualizar y Guardar Excel";
    if (document.getElementById("btnCancelPatient")) document.getElementById("btnCancelPatient").style.display = "inline-block";

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deletePatient(index) {
    if (confirm("¿Está seguro de eliminar este paciente del registro?")) {
        patients.splice(index, 1);
        persistPatients();
        renderPatients();
        autoExportToExcel();
        resetPatientForm();
    }
}

function resetPatientForm() {
    if (document.getElementById("patCedula")) document.getElementById("patCedula").value = "";
    if (document.getElementById("patNombre")) document.getElementById("patNombre").value = "";
    if (document.getElementById("patNacimiento")) document.getElementById("patNacimiento").value = "";
    if (document.getElementById("patTelefono")) document.getElementById("patTelefono").value = "";
    if (document.getElementById("patCorreo")) document.getElementById("patCorreo").value = "";
    if (document.getElementById("patDireccion")) document.getElementById("patDireccion").value = "";
    if (document.getElementById("editPatientIndex")) document.getElementById("editPatientIndex").value = "-1";
    if (document.getElementById("patientFormTitle")) document.getElementById("patientFormTitle").innerText = "Nuevo Registro de Paciente";
    if (document.getElementById("btnSavePatient")) document.getElementById("btnSavePatient").innerText = "Guardar y Actualizar Excel";
    if (document.getElementById("btnCancelPatient")) document.getElementById("btnCancelPatient").style.display = "none";
}

function persistPatients() {
    localStorage.setItem("lab_pacientes", JSON.stringify(patients));
}

async function autoExportToExcel() {
    if (patients.length === 0) return;

    const dataToExport = patients.map(p => ({
        "Cédula": p.cedula,
        "Apellidos y Nombres": p.nombre,
        "Fecha de Nacimiento": p.nacimiento,
        "Género": p.genero,
        "Teléfono": p.telefono,
        "Correo": p.correo,
        "Dirección": p.direccion
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pacientes");
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if ('showSaveFilePicker' in window) {
        try {
            const options = {
                suggestedName: 'pacientes_lab.xlsx',
                types: [{
                    description: 'Archivos Excel',
                    accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
                }]
            };
            
            if (!window.fileHandle) {
                window.fileHandle = await window.showSaveFilePicker(options);
            }
            
            const writableStream = await window.fileHandle.createWritable();
            await writableStream.write(blob);
            await writableStream.close();
            console.log("Archivo actualizado exitosamente en la misma ruta.");
            return;
        } catch (err) {
            console.log("El usuario canceló el selector o el navegador restringió la acción.");
        }
    }

    XLSX.writeFile(workbook, "pacientes_lab.xlsx");
}
