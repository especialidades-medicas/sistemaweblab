// Manejo de Filas en Receta
function agregarFilaMed() {
    const container = document.getElementById('medicamentosContainer');
    const div = document.createElement('div');
    div.className = 'med-item-row';
    div.innerHTML = `
        <div class="med-field flex-grow-2">
            <label class="mobile-only">Medicamento / Presentación</label>
            <input type="text" class="med-nombre" placeholder="Ej. Paracetamol 500mg">
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
            <input type="text" class="med-duracion" placeholder="Ej. 5 días">
        </div>
        <div class="med-action">
            <button type="button" class="btn-icon-delete" title="Eliminar medicamento" onclick="eliminarFilaMed(this)" aria-label="Eliminar fila">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
        </div>
    `;
    container.appendChild(div);
}

function eliminarFilaMed(btn) {
    const items = document.querySelectorAll('.med-item-row');
    if (items.length > 1) {
        // Remueve la fila contenedora completa (.med-item-row)
        btn.closest('.med-item-row').remove();
    } else {
        alert("Debe mantener al menos un medicamento en la receta.");
    }
}

// Función auxiliar para cargar imagen como objeto antes de renderizar
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

    const fecha = document.getElementById('recFecha')?.value.trim() || '';
    const cedula = document.getElementById('recCedula')?.value.trim() || '';
    const nombres = document.getElementById('recNombres')?.value.trim() || '';
    const edad = document.getElementById('recEdad')?.value.trim() || '';
    const alergias = document.getElementById('recAlergias')?.value.trim() || '';
    const diagnostico = document.getElementById('recDiagnostico')?.value.trim() || '';
    const indicacionesElem = document.getElementById('recIndicaciones');
    const indicaciones = indicacionesElem ? indicacionesElem.value.trim() : '';

    // Validación básica de datos obligatorios por JS
    if (!cedula || !nombres) {
        alert("Por favor completa los campos obligatorios del paciente (Cédula y Nombres).");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // --- ENCABEZADO CON LOGO ---
    try {
        const imgLogo = await cargarImagen('../img/logFisio.png');
        // Renderiza el logo en (x: 15, y: 10, ancho: 22, alto: 22)
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
    doc.text(`Paciente:`, 20, y + 8); doc.setFont("helvetica", "normal"); doc.text(nombres, 40, y + 8);
    doc.setFont("helvetica", "bold");
    doc.text(`Cédula:`, 130, y + 8); doc.setFont("helvetica", "normal"); doc.text(cedula, 150, y + 8);

    doc.setFont("helvetica", "bold");
    doc.text(`Fecha:`, 20, y + 15); doc.setFont("helvetica", "normal"); doc.text(fecha, 40, y + 15);
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

    // Selector estandarizado a .med-item-row
    const medItems = document.querySelectorAll('#medicamentosContainer .med-item-row');
    medItems.forEach(item => {
        const nombre = item.querySelector('.med-nombre')?.value || '';
        const dosis = item.querySelector('.med-dosis')?.value || '';
        const frec = item.querySelector('.med-frecuencia')?.value || '';
        const duracion = item.querySelector('.med-duracion')?.value || '';

        // Control de ancho y división de texto para evitar encimamiento
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
    const cedula = document.getElementById('recCedula')?.value.trim() || '';
    if (cedula.length < 5) return;

    fetch(`../ControladorPacientes?accion=buscar&cedula=${cedula}`)
        .then(response => response.json())
        .then(p => {
            if (p && (p.cedula || p.nombres)) {
                if (document.getElementById('recNombres')) {
                    document.getElementById('recNombres').value = p.nombres || '';
                }
                
                if (p.fechaNacimiento && document.getElementById('recEdad')) {
                    const edadCalculada = calcularEdad(p.fechaNacimiento);
                    document.getElementById('recEdad').value = edadCalculada ? `${edadCalculada} años` : '';
                }
            } else {
                console.warn("Paciente no encontrado en la base de datos.");
            }
        })
        .catch(error => {
            console.error("Error al buscar el paciente:", error);
        });
}
