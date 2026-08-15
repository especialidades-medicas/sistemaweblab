// --- CONTROLLER: HISTORIA CLÍNICA Y MAPA DE DOLOR ---

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha actual en el formulario de historia clínica si existe
    const hcFecha = document.getElementById('hcFecha');
    if (hcFecha && !hcFecha.value) {
        hcFecha.value = new Date().toISOString().split('T')[0];
    }
});

// Evento para capturar el maniquí en imagen y mostrarlo debajo del texto
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'btnCapturarMapa') {
        const elementoAHTML = document.getElementById('bodyContainerToCapture');
        if (!elementoAHTML) {
            alert("No se encontró el contenedor del mapa de dolor.");
            return;
        }
        
        if (typeof html2canvas === 'undefined') {
            alert("La librería html2canvas no está cargada.");
            return;
        }

        html2canvas(elementoAHTML).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const container = document.getElementById('previewCapturaContainer');
            if (container) {
                container.innerHTML = `
                    <p style="font-size: 0.85rem; color: #2b9348; font-weight: 600; margin-bottom: 5px;">¡Captura generada con éxito!</p>
                    <img src="${imgData}" alt="Captura Mapa de Dolor" style="max-width: 100%; height: auto; max-height: 200px; border-radius: 6px; border: 1px solid #dee2e6; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
                `;
            }
        }).catch(err => {
            console.error("Error al generar la captura:", err);
        });
    }
});

// Función completa para incluir todos los campos y la imagen capturada en el PDF de Historia Clínica
function guardarYGenerarPDF(event) {
    event.preventDefault();
    
    if (!window.jspdf) {
        alert("La librería jsPDF no está cargada.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // 1. Recopilar datos de todos los campos del formulario de Fisiolab
    const numHC = document.getElementById('hcNum')?.value || '';
    const fecha = document.getElementById('hcFecha')?.value || '';
    const cedula = document.getElementById('hcCedula')?.value || '';
    const nombres = document.getElementById('hcNombres')?.value || '';
    const nacimiento = document.getElementById('hcNacimiento')?.value || '';
    const edad = document.getElementById('hcEdad')?.value || '';
    const sexo = document.getElementById('hcSexo')?.value || '';
    const celular = document.getElementById('hcCelular')?.value || '';
    const email = document.getElementById('hcEmail')?.value || '';
    const direccion = document.getElementById('hcDireccion')?.value || '';
    const emergenciaContacto = document.getElementById('hcEmergenciaContacto')?.value || '';
    const emergenciaTelefono = document.getElementById('hcEmergenciaTelefono')?.value || '';
    
    const antecedentes = Array.from(document.querySelectorAll('.ant:checked')).map(el => el.value).join(', ');
    const otrosAnt = document.getElementById('hcOtrosAnt')?.value || '';
    const publicidad = document.getElementById('hcPublicidad')?.value || '';

    const motivo = document.getElementById('hcMotivo')?.value || '';
    const profesion = document.getElementById('hcProfesion')?.value || '';
    const tipoTrabajo = document.getElementById('hcTipoTrabajo')?.value || '';
    const sedestacion = document.getElementById('hcSedestacion')?.value || '';
    const esfuerzo = document.getElementById('hcEsfuerzo')?.value || '';

    const asimetria = document.getElementById('hcAsimetria')?.value || '';
    const atrofias = document.getElementById('hcAtrofias')?.value || '';
    const inflamacion = document.getElementById('hcInflamacion')?.value || '';
    const contracturas = document.getElementById('hcContracturas')?.value || '';
    const irradiacion = document.getElementById('hcIrradiacion')?.value || '';
    const haciaDonde = document.getElementById('hcHaciaDonde')?.value || '';
    const puntoDolorTexto = document.getElementById('hcPuntoDolor')?.value || '';

    const eva = document.getElementById('hcEva')?.value || '';
    const sesion = document.getElementById('hcSesion')?.value || '';
    const terapeuta = document.getElementById('hcTerapeuta')?.value || '';
    const tratamientos = Array.from(document.querySelectorAll('.trat:checked')).map(el => el.value).join(', ');
    const diagnostico = document.getElementById('hcDiagnostico')?.value || '';

    let y = 15;

    function verificarEspacio(espacioNecesario = 10) {
        if (y > 275 - espacioNecesario) {
            doc.addPage();
            y = 15;
        }
    }

    const imgLogo = new Image();
    imgLogo.crossOrigin = "Anonymous";
    imgLogo.src = '../img/logFisior.png'; // Asegúrate que el nombre de la imagen sea correcto
    
    imgLogo.onload = function() {
        try { doc.addImage(imgLogo, 'PNG', 14, 10, 22, 22); } catch(e){}
        generarContenidoPDF();
    };

    imgLogo.onerror = function() {
        generarContenidoPDF();
    };

    if (imgLogo.complete) {
        try { doc.addImage(imgLogo, 'PNG', 14, 10, 22, 22); } catch(e){}
        generarContenidoPDF();
    }

    function generarContenidoPDF() {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text("CENTRO DE REHABILITACIÓN FÍSICA - FISIOLAB.ST", 42, 16);

        doc.setFontSize(10.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("HISTORIA CLÍNICA FISIOTERAPÉUTICA", 42, 22);

        doc.setLineWidth(0.6);
        doc.setDrawColor(67, 97, 238);
        doc.line(14, 33, 196, 33);

        y = 38;

        function agregarSeccionTitulo(titulo) {
            verificarEspacio(12);
            doc.setFillColor(241, 243, 245);
            doc.rect(14, y - 4, 182, 6, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(58, 12, 163);
            doc.text(titulo, 16, y);
            y += 6;
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);
            doc.setFontSize(9);
        }

        agregarSeccionTitulo("1. Datos Personales");
        doc.text(`N° HC: ${numHC || 'N/D'}`, 14, y);
        doc.text(`Fecha: ${fecha || 'N/D'}`, 110, y);
        y += 5;
        doc.text(`Cédula: ${cedula || 'N/D'}`, 14, y);
        doc.text(`Edad: ${edad || 'N/D'} años  |  Sexo: ${sexo || 'N/D'}`, 110, y);
        y += 5;
        doc.text(`Paciente: ${nombres || 'N/D'}`, 14, y);
        y += 5;
        doc.text(`Celular: ${celular || 'N/D'}`, 14, y);
        doc.text(`Email: ${email || 'N/D'}`, 110, y);
        y += 5;
        doc.text(`Dirección: ${direccion || 'N/D'}`, 14, y, { maxWidth: 180 });
        y += 5;
        doc.text(`Emergencia: ${emergenciaContacto || 'N/D'} (${emergenciaTelefono || 'N/D'})`, 14, y);
        y += 8;

        agregarSeccionTitulo("2. Antecedentes Personales del Paciente");
        doc.text(`Patologías / Condiciones: ${antecedentes || "Ninguna marcada"}`, 14, y, { maxWidth: 180 });
        y += 5;
        if (otrosAnt) {
            doc.text(`Otros antecedentes: ${otrosAnt}`, 14, y, { maxWidth: 180 });
            y += 5;
        }
        doc.text(`Publicidad / Medio: ${publicidad || "No especificado"}`, 14, y);
        y += 8;

        agregarSeccionTitulo("3. Motivo de Consulta y Factores Ocupacionales");
        doc.text(`Descripción del problema: ${motivo || "No especificado"}`, 14, y, { maxWidth: 180 });
        y += 5;
        doc.text(`Profesión: ${profesion || 'N/D'}`, 14, y);
        doc.text(`Tipo de Trabajo: ${tipoTrabajo || 'N/D'}`, 110, y);
        y += 5;
        doc.text(`Sedestación Prolongada: ${sedestacion}  |  Esfuerzo Físico: ${esfuerzo}`, 14, y);
        y += 8;

        agregarSeccionTitulo("4. Evaluación Fisioterapéutica (Inspección y Palpación)");
        doc.text(`Asimetría: ${asimetria || 'N/D'}`, 14, y);
        doc.text(`Atrofias: ${atrofias || 'N/D'}`, 110, y);
        y += 5;
        doc.text(`Inflamación / Edema: ${inflamacion || 'N/D'}`, 14, y);
        doc.text(`Contracturas: ${contracturas || 'N/D'}`, 110, y);
        y += 5;
        doc.text(`Irradiación del Dolor: ${irradiacion} (Hacia: ${haciaDonde || "N/A"})`, 14, y);
        y += 5;
        doc.text(`Zonas de Dolor Seleccionadas: ${puntoDolorTexto || "Ninguna zona especificada"}`, 14, y, { maxWidth: 180 });
        y += 8;

        agregarSeccionTitulo("5. Planificación y Seguimiento del Tratamiento");
        doc.text(`Escala EVA (Dolor): ${eva ? eva + '/10' : 'N/D'}`, 14, y);
        doc.text(`N° de Sesión: ${sesion || '1'}`, 110, y);
        y += 5;
        doc.text(`Terapeuta a Cargo: ${terapeuta || 'N/D'}`, 14, y);
        y += 5;
        doc.text(`Modalidades Aplicadas: ${tratamientos || "Ninguna seleccionada"}`, 14, y, { maxWidth: 180 });
        y += 5;
        doc.text(`Diagnóstico Fisioterapéutico: ${diagnostico || "No especificado"}`, 14, y, { maxWidth: 180 });
        y += 10;

        const previewImg = document.querySelector('#previewCapturaContainer img');
        if (previewImg) {
            verificarEspacio(65);
            agregarSeccionTitulo("6. Mapa de Dolor Corporal (Captura)");
            try {
                doc.addImage(previewImg.src, 'PNG', 35, y, 130, 60);
                y += 65;
            } catch (e) {
                console.error("Error al incrustar la imagen del mapa corporal", e);
            }
        }

        doc.save(`HistoriaClinica_${cedula || 'paciente'}.pdf`);
        alert("¡Historia Clínica profesional generada con éxito!");
    }
}