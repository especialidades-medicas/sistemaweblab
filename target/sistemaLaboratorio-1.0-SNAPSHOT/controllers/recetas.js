// Manejo de Filas en Receta
        function agregarFilaMed() {
            const container = document.getElementById('medicamentosContainer');
            const div = document.createElement('div');
            div.className = 'med-item';
            div.innerHTML = `
                <input type="text" class="med-nombre" placeholder="Medicamento / Presentación" required>
                <input type="text" class="med-dosis" placeholder="Dosis" required>
                <input type="text" class="med-frecuencia" placeholder="Frecuencia" required>
                <input type="text" class="med-duracion" placeholder="Duración" required>
                <button type="button" class="btn-delete" onclick="eliminarFilaMed(this)">✕</button>
            `;
            container.appendChild(div);
        }

        function eliminarFilaMed(btn) {
            const items = document.querySelectorAll('.med-item');
            if (items.length > 1) {
                btn.parentElement.remove();
            } else {
                alert("Debe mantener al menos un medicamento en la receta.");
            }
        }
        
        
        function generarPDFReceta(e) {
            e.preventDefault();
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const fecha = document.getElementById('recFecha').value;
            const cedula = document.getElementById('recCedula').value;
            const nombres = document.getElementById('recNombres').value;
            const edad = document.getElementById('recEdad').value;
            const alergias = document.getElementById('recAlergias').value;
            const diagnostico = document.getElementById('recDiagnostico').value;
            const indicaciones = document.getElementById('recIndicaciones').value;

            // Encabezado
            doc.setFillColor(29, 53, 87);
            doc.rect(0, 0, 210, 28, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.setTextColor(255, 255, 255);
            doc.text("RECETARIO MÉDICO - ESPECIALIDADES MÉDICAS", 15, 17);

            // Datos Paciente Box
            doc.setFillColor(248, 249, 250);
            doc.roundedRect(15, 34, 180, 28, 2, 2, 'F');
            doc.setFontSize(8.5);
            doc.setTextColor(30, 30, 30);
            doc.setFont("helvetica", "bold");
            doc.text(`Paciente:`, 20, 42); doc.setFont("helvetica", "normal"); doc.text(nombres, 40, 42);
            doc.setFont("helvetica", "bold");
            doc.text(`Cédula:`, 130, 42); doc.setFont("helvetica", "normal"); doc.text(cedula, 150, 42);

            doc.setFont("helvetica", "bold");
            doc.text(`Fecha:`, 20, 49); doc.setFont("helvetica", "normal"); doc.text(fecha, 40, 49);
            doc.setFont("helvetica", "bold");
            doc.text(`Edad:`, 80, 49); doc.setFont("helvetica", "normal"); doc.text(edad || 'N/D', 95, 49);
            doc.setFont("helvetica", "bold");
            doc.text(`Alergias:`, 130, 49); doc.setFont("helvetica", "normal"); doc.text(alergias, 150, 49);

            doc.setFont("helvetica", "bold");
            doc.text(`Diagnóstico:`, 20, 56); doc.setFont("helvetica", "normal"); doc.text(diagnostico || 'N/D', 45, 56);

            // Prescripción Table Header
            let y = 70;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(29, 53, 87);
            doc.text("PRESCRIPCIÓN FARMACOLÓGICA (Rp.)", 15, y);
            y += 6;

            doc.setFillColor(230, 235, 240);
            doc.rect(15, y, 180, 7, 'F');
            doc.setFontSize(8);
            doc.setFont("helvetica", "bold");
            doc.text("Medicamento / Presentación", 18, y + 5);
            doc.text("Dosis", 100, y + 5);
            doc.text("Frecuencia", 135, y + 5);
            doc.text("Duración", 170, y + 5);

            y += 11;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8.5);

            const medItems = document.querySelectorAll('.med-item');
            medItems.forEach(item => {
                const nombre = item.querySelector('.med-nombre').value;
                const dosis = item.querySelector('.med-dosis').value;
                const frec = item.querySelector('.med-frecuencia').value;
                const duracion = item.querySelector('.med-duracion').value;

                doc.text(nombre, 18, y);
                doc.text(dosis, 100, y);
                doc.text(frec, 135, y);
                doc.text(duracion, 170, y);
                y += 7;
            });

            y += 8;
            if (indicaciones) {
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9.5);
                doc.setTextColor(29, 53, 87);
                doc.text("INDICACIONES Y CUIDADOS GENERALES", 15, y);
                y += 6;
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8.5);
                doc.setTextColor(30, 30, 30);
                let splitInd = doc.splitTextToSize(indicaciones, 180);
                doc.text(splitInd, 15, y);
            }

            // Firma
            doc.setLineWidth(0.4);
            doc.setDrawColor(200, 200, 200);
            doc.line(70, 240, 140, 240);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text("Firma y Sello Médico", 105, 246, { align: "center" });

            doc.save(`Receta_Medica_${cedula}.pdf`);
            alert("¡Receta médica (PDF) generada correctamente!");
        }
        
        function autocompletarPacienteReceta() {
    const cedula = document.getElementById('recCedula').value.trim();
    if (cedula.length < 5) return; // Espera a que se ingrese una cédula válida

    // Realiza la petición al servlet de pacientes configurado en tu proyecto
    fetch(`../ControladorPacientes?accion=buscar&cedula=${cedula}`)
        .then(response => response.json())
        .then(p => {
            if (p && (p.cedula || p.nombres)) {
                document.getElementById('recNombres').value = p.nombres || '';
                
                // Calcular edad si viene la fecha de nacimiento
                if (p.fechaNacimiento) {
                    const edadCalculada = calcularEdad(p.fechaNacimiento);
                    document.getElementById('recEdad').value = edadCalculada ? `${edadCalculada} años` : '';
                }
            } else {
                // Si no se encuentra en la BD, limpia o permite ingreso manual sin bloquear
                console.warn("Paciente no encontrado en la base de datos.");
            }
        })
        .catch(error => {
            console.error("Error al buscar el paciente:", error);
        });
}