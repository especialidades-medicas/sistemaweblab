// ==========================================
// MANEJO DE FILAS DINÁMICAS (RECETAS)
// ==========================================
function agregarFilaMed() {
    const container = document.getElementById('medicamentosContainer');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'med-item-row';
    div.innerHTML = `
        <div class="med-field flex-grow-2">
            <label class="mobile-only">Medicamento / Presentación</label>
            <input type="text" class="med-nombre" placeholder="Ej. Ibuprofeno 400mg">
        </div>
        <div class="med-field">
            <label class="mobile-only">Dosis</label>
            <input type="text" class="med-dosis" placeholder="Ej. 1 tableta">
        </div>
        <div class="med-field">
            <label class="mobile-only">Frecuencia</label>
            <input type="text" class="med-frecuencia" placeholder="Ej. c/8 horas">
        </div>
        <div class="med-field">
            <label class="mobile-only">Duración</label>
            <input type="text" class="med-duracion" placeholder="Ej. 3 días">
        </div>
        <div class="med-action">
            <button type="button" class="btn-icon-delete" title="Eliminar medicamento" onclick="eliminarFilaMed(this)" aria-label="Eliminar fila">
                ✕
            </button>
        </div>
    `;
    container.appendChild(div);
}

function eliminarFilaMed(btn) {
    const items = document.querySelectorAll('.med-item-row');
    if (items.length > 1) {
        // Elimina el contenedor padre completo de la fila
        const fila = btn.closest('.med-item-row');
        if (fila) fila.remove();
    } else {
        alert("Debe mantener al menos un medicamento en la receta.");
    }
}

// ==========================================
// GENERACIÓN DE PDF Y AUTOCOMPLETADO
// ==========================================

// Función auxiliar para cargar imagen como objeto antes de renderizar en PDF
function cargarImagen(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = url;
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
    });
}

async function generarPDFReceta(e) {
    e.preventDefault();

    // Comprobación de seguridad en lectura de inputs (evita que el código muera si falta un ID)
    const fecha = document.getElementById('recFecha')?.value || '';
    const cedula = document.getElementById('recCedula')?.value || '';
    const nombres = document.getElementById('recNombres')?.value || '';
    const edad = document.getElementById('recEdad')?.value || '';
    const alergias = document.getElementById('recAlergias')?.value || '';
    const diagnostico = document.getElementById('recDiagnostico')?.value || '';
    const indicaciones = document.getElementById('recIndicaciones')?.value || '';

    if (!window.jspdf) {
        alert("La librería jsPDF no está cargada correctamente.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- ENCABEZADO CON LOGO ---
    try {
        const imgLogo = await cargarImagen('../img/logFisio.png');
        doc.addImage(imgLogo, 'PNG', 15, 10, 22, 22);
    } catch (err) {
        console.warn("No se pudo cargar el logo, continuando sin imagen.", err);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(29, 53, 87);
    doc.text("RECETARIO MÉDICO - ESPECIALIDADES MÉDICAS", 42, 22);

    // Límite para salto de página
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginBottom = 50; 

    // --- DATOS DEL PACIENTE ---
    let y = 38;
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(15, y, 180, 28, 2, 2, 'F');

    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(`Paciente:`, 20, y + 8); doc.setFont("helvetica", "normal"); doc.text(nombres || '', 40, y + 8);
    doc.setFont("helvetica", "bold");
    doc.text(`Cédula:`, 130, y + 8); doc.setFont("helvetica", "normal"); doc.text(cedula || '', 150, y + 8);

    doc.setFont("helvetica", "bold");
    doc.text(`Fecha:`, 20, y + 15); doc.setFont("helvetica", "normal"); doc.text(fecha || '', 40, y + 15);
    doc.setFont("helvetica", "bold");
    doc.text(`Edad:`, 80, y + 15); doc.setFont("helvetica", "normal"); doc.text(edad || 'N/D', 95, y + 15);
    doc.setFont("helvetica", "bold");
    doc.text(`Alergias:`, 130, y + 15); doc.setFont("helvetica", "normal"); doc.text(alergias || 'Ninguna', 150, y + 15);

    doc.setFont("helvetica", "bold");
    doc.text(`Diagnóstico:`, 20, y + 22); doc.setFont("helvetica", "normal"); doc.text(diagnostico || 'N/D', 45, y + 22);

    // --- TABLA DE PRESCRIPCIÓN ---
    y += 36;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(29, 53, 87);
    doc.text("PRESCRIPCIÓN FARMACOLÓGICA (Rp.)", 15, y);

    y += 5;
    doc.setFillColor(230, 235, 240);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Medicamento / Presentación", 18, y + 5);
    doc.text("Dosis", 100, y + 5);
    doc.text("Frecuencia", 135, y + 5);
    doc.text("Duración", 170, y + 5);

    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    // Búsqueda unificada por clase .med-item-row (Sincronizado con HTML)
    const medItems = document.querySelectorAll('.med-item-row');
    medItems.forEach(item => {
        const nombre = item.querySelector('.med-nombre')?.value || '';
        const dosis = item.querySelector('.med-dosis')?.value || '';
        const frec = item.querySelector('.med-frecuencia')?.value || '';
        const duracion = item.querySelector('.med-duracion')?.value || '';

        const splitNombre = doc.splitTextToSize(nombre, 78);
        const splitDosis = doc.splitTextToSize(dosis, 30);
        const splitFrec = doc.splitTextToSize(frec, 32);
        const splitDuracion = doc.splitTextToSize(duracion, 23);

        const lineasMaximas = Math.max(
            splitNombre.length, 
            splitDosis.length, 
            splitFrec.length, 
            splitDuracion.length
        );

        // Control de salto de página
        if (y + (lineasMaximas * 5) > pageHeight - marginBottom) {
            doc.addPage();
            y = 20;
        }

        doc.text(splitNombre, 18, y);
        doc.text(splitDosis, 100, y);
        doc.text(splitFrec, 135, y);
        doc.text(splitDuracion, 170, y);

        y += (lineasMaximas * 5) + 3;
    });

    // --- INDICACIONES ---
    if (indicaciones) {
        y += 5;
        if (y + 15 > pageHeight - marginBottom) {
            doc.addPage();
            y = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(29, 53, 87);
        doc.text("INDICACIONES Y CUIDADOS GENERALES", 15, y);

        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 30, 30);

        let splitInd = doc.splitTextToSize(indicaciones, 180);
        
        if (y + (splitInd.length * 4) > pageHeight - marginBottom) {
            doc.addPage();
            y = 20;
        }

        doc.text(splitInd, 15, y);
        y += (splitInd.length * 4) + 10;
    }

    // --- FIRMA Y SELLO MÉDICO ---
    if (y + 30 > pageHeight - 15) {
        doc.addPage();
        y = pageHeight - 50;
    } else {
        y = Math.max(y + 20, pageHeight - 45); 
    }

    doc.setLineWidth(0.4);
    doc.setDrawColor(200, 200, 200);
    doc.line(70, y, 140, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text("Firma y Sello Médico", 105, y + 6, { align: "center" });

    doc.save(`Receta_Medica_${cedula || 'Paciente'}.pdf`);
    alert("¡Receta médica (PDF) generada correctamente!");
}

function autocompletarPacienteReceta() {
    const elCedula = document.getElementById('recCedula');
    if (!elCedula) return;

    const cedula = elCedula.value.trim();
    if (cedula.length < 5) return;

    fetch(`../ControladorPacientes?accion=buscar&cedula=${cedula}`)
        .then(response => response.json())
        .then(p => {
            if (p && (p.cedula || p.nombres)) {
                const elNombres = document.getElementById('recNombres');
                if (elNombres) elNombres.value = p.nombres || '';
                
                // Si tienes la función de edad en otro lado de tu proyecto:
                if (p.fechaNacimiento && typeof calcularEdad === 'function') {
                    const edadCalculada = calcularEdad(p.fechaNacimiento);
                    const elEdad = document.getElementById('recEdad');
                    if (elEdad) elEdad.value = edadCalculada ? `${edadCalculada} años` : '';
                }
            } else {
                console.warn("Paciente no encontrado en la base de datos.");
            }
        })
        .catch(error => {
            console.error("Error al buscar el paciente:", error);
        });
}
