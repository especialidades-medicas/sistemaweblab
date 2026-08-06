function procesarSelectsParaImpresion(contenedor, ocultar) {
            const selects = contenedor.querySelectorAll('select');
            selects.forEach(select => {
                let textoSeleccionado = "";
                if (select.selectedIndex >= 0 && select.options[select.selectedIndex]) {
                    textoSeleccionado = select.options[select.selectedIndex].text;
                }
                if (textoSeleccionado.includes("Seleccione") || textoSeleccionado === "Seleccione Método...") {
                    textoSeleccionado = "";
                }

                const span = document.createElement('span');
                span.className = 'select-reemplazo-print fw-bold';
                span.style.fontSize = select.style.fontSize || 'inherit';
                span.innerText = textoSeleccionado;

                if (ocultar) {
                    select.style.display = 'none';
                    const existente = select.parentNode.querySelector('.select-reemplazo-print');
                    if (!existente) {
                        select.parentNode.insertBefore(span, select);
                    }
                } else {
                    select.style.display = '';
                    const reemplazo = select.parentNode.querySelector('.select-reemplazo-print');
                    if (reemplazo) reemplazo.remove();
                }
            });
        }

        function actualizarTablaDinamica() {
            const tbody = document.getElementById("tablaResultadosUnificada");
            if (!tbody) return;
            tbody.innerHTML = "";

            const secciones = document.querySelectorAll('#mainTabContent .tab-pane');
            let totalValidados = 0;
            let clavesGlobalesUnicas = new Set();

            secciones.forEach(pane => {
                const titulosSeccion = pane.querySelectorAll('.section-title');

                titulosSeccion.forEach(tituloElem => {
                    const tituloSeccion = tituloElem.getAttribute('data-section-name');
                    let esPanelTorch = tituloSeccion.includes("TORCH");
                    let textoMetodoSeccion = "";
                    let siguiente = tituloElem.nextElementSibling;
                    let contenedorSeccion = [];

                    while (siguiente && !siguiente.classList.contains('section-title')) {
                        contenedorSeccion.push(siguiente);
                        siguiente = siguiente.nextElementSibling;
                    }

                    if (esPanelTorch) {
                        for (let el of contenedorSeccion) {
                            let inputMetodo = el.querySelector('input[id*="metodo"]') || 
                                              (el.tagName && el.tagName.toLowerCase() === 'input' && el.id && el.id.toLowerCase().includes('metodo') ? el : el.querySelector('input[id*="metodo"]'));
                            
                            if (inputMetodo && inputMetodo.value.trim() !== "") {
                                textoMetodoSeccion = inputMetodo.value.trim();
                                break;
                            }
                        }
                    }

                    let filasValidasDeSeccion = [];

                    contenedorSeccion.forEach(el => {
                        let inputsEditables = el.querySelectorAll('.form-control-editable');

                        inputsEditables.forEach(input => {
                            let valor = input.value ? input.value.trim() : "";
                            
                            if (valor !== "" && valor !== "Seleccione...") {
                                let filaOriginal = input.closest("tr");
                                if (filaOriginal) {
                                    let celdas = filaOriginal.querySelectorAll("td");
                                    if (celdas.length >= 2) {
                                        let inputNombreCustom = celdas[0].querySelector('input[id^="nombreExamen"]');
                                        let nombreExamen = "";

                                        if (inputNombreCustom) {
                                            let nombreVal = inputNombreCustom.value.trim();
                                            nombreExamen = (nombreVal !== "" ? nombreVal : "Examen Personalizado");
                                        } else {
                                            let clonCelda = celdas[0].cloneNode(true);
                                            let inputsInternos = clonCelda.querySelectorAll('input, select');
                                            inputsInternos.forEach(inp => inp.remove());
                                            nombreExamen = clonCelda.innerText.trim();
                                        }

                                        let examenTexto = nombreExamen;
                                        if (!esPanelTorch) {
                                            let selectMetodo = celdas[0].querySelector('select');
                                            let inputMetodoText = celdas[0].querySelector('input[id*="metodo"]');

                                            if (selectMetodo && selectMetodo.selectedIndex > 0) {
                                                let textoSelect = selectMetodo.options[selectMetodo.selectedIndex].text;
                                                examenTexto += `<br><small class="text-secondary fst-italic">${textoSelect}</small>`;
                                            } else if (inputMetodoText && inputMetodoText.value.trim() !== "") {
                                                let textoInput = inputMetodoText.value.trim();
                                                examenTexto += `<br><small class="text-secondary fst-italic">${textoInput}</small>`;
                                            }
                                        }

                                        let unidad = "";
                                        if (celdas[2]) {
                                            let inputUnidad = celdas[2].querySelector("input");
                                            unidad = inputUnidad ? inputUnidad.value.trim() : celdas[2].innerText.trim();
                                        }
                                        
                                        let referencia = "";
                                        if (celdas[3]) {
                                            let inputRef = celdas[3].querySelector("input");
                                            referencia = inputRef ? inputRef.value.trim() : celdas[3].innerText.trim();
                                        }

                                        if (nombreExamen !== "") {
                                            let claveUnica = tituloSeccion + "_" + nombreExamen;
                                            if (!clavesGlobalesUnicas.has(claveUnica)) {
                                                clavesGlobalesUnicas.add(claveUnica);
                                                filasValidasDeSeccion.push({
                                                    examen: examenTexto,
                                                    resultado: valor,
                                                    unidad: unidad,
                                                    referencia: referencia
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    });

                    if (filasValidasDeSeccion.length > 0) {
                        totalValidados += filasValidasDeSeccion.length;

                        let filaTitulo = document.createElement("tr");
                        filaTitulo.innerHTML = `<td colspan="4" class="fw-bold bg-light text-primary">${tituloSeccion}</td>`;
                        tbody.appendChild(filaTitulo);

                        if (esPanelTorch && textoMetodoSeccion !== "") {
                            let filaMetodo = document.createElement("tr");
                            filaMetodo.innerHTML = `<td colspan="4" class="text-secondary fst-italic small bg-white">Método: ${textoMetodoSeccion}</td>`;
                            tbody.appendChild(filaMetodo);
                        }

                        filasValidasDeSeccion.forEach(item => {
                            let nuevaFila = document.createElement("tr");
                            nuevaFila.innerHTML = `
                                <td>${item.examen}</td>
                                <td>${item.resultado}</td>
                                <td>${item.unidad}</td>
                                <td>${item.referencia}</td>
                            `;
                            tbody.appendChild(nuevaFila);
                        });
                    }
                });
            });

            if (totalValidados === 0) {
                let filaVacia = document.createElement("tr");
                filaVacia.innerHTML = `<td colspan="4" class="text-center text-muted">No hay exámenes con resultados ingresados.</td>`;
                tbody.appendChild(filaVacia);
            }
        }

        document.addEventListener("input", actualizarTablaDinamica);
        document.addEventListener("change", actualizarTablaDinamica); 

        // Unificación de inicializaciones al cargar el DOM
        window.addEventListener('DOMContentLoaded', () => {
            // 1. Fecha actual e inputs de paciente/sincronización visual
            const campoFecha = document.getElementById('fechaActual');
            if (campoFecha) {
                if (!campoFecha.value || campoFecha.value.trim() === "") {
                    const hoy = new Date();
                    const dia = String(hoy.getDate()).padStart(2, '0');
                    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                    const anio = hoy.getFullYear();
                    campoFecha.value = `${anio}-${mes}-${dia}`;
                }
            }

            const txtFechaVisual = document.getElementById('txtFechaActualVisual');
            if (txtFechaVisual && campoFecha) {
                txtFechaVisual.innerText = campoFecha.value;
            }

            if (campoFecha) {
                ['input', 'change', 'blur'].forEach(evento => {
                    campoFecha.addEventListener(evento, () => {
                        if (txtFechaVisual) txtFechaVisual.innerText = campoFecha.value;
                    });
                });
            }

            // Sincronización de datos generales en tiempo real para la impresión
            document.addEventListener("input", function (e) {
                if (e.target && e.target.id) {
                    const mapeo = {
                        'idOrden': 'txtIdOrdenVisual',
                        'codDoc': 'txtCodDocVisual',
                        'nombrePaciente': 'txtNombreVisual',
                        'fechaNacimiento': 'txtFechaNacVisual',
                        'edadPaciente': 'txtEdadVisual',
                        'fechaActual': 'txtFechaActualVisual',
                        'sexoPaciente': 'txtSexoVisual',
                        'telefonoPaciente': 'txtTelVisual'
                    };
                    if (mapeo[e.target.id]) {
                        const destino = document.getElementById(mapeo[e.target.id]);
                        if (destino) destino.innerText = e.target.value;
                    }
                }
            });

            // 2. Cálculos de Química Sanguínea (BUN y LDL)
            const btnBUN = document.getElementById("btnCalcularBUN");
            if (btnBUN) {
                btnBUN.addEventListener("click", function() {
                    try {
                        let ureaStr = document.getElementById("txtUrea").value.trim().replace(",", ".");
                        if (ureaStr !== "") {
                            let urea = parseFloat(ureaStr);
                            if (isNaN(urea)) {
                                alert("Valor de urea inválido. Asegúrese de ingresar números.");
                                return;
                            }
                            let bun = urea / 2.14;
                            let inputBun = document.getElementById("txtBun");
                            inputBun.value = bun.toFixed(2);
                            inputBun.dispatchEvent(new Event('input', { bubbles: true }));
                        } else {
                            alert("Por favor, ingrese el valor de la Urea.");
                        }
                    } catch (ex) {
                        alert("Ocurrió un error al calcular el BUN.");
                    }
                });
            }

            const btnLDL = document.getElementById("btnCalcularLDL");
            if (btnLDL) {
                btnLDL.addEventListener("click", function() {
                    try {
                        let colStr = document.getElementById("txtColesterol").value.trim().replace(",", ".");
                        let trigStr = document.getElementById("txtTrigliceridos").value.trim().replace(",", ".");
                        let hdlStr = document.getElementById("txtHDL").value.trim().replace(",", ".");

                        if (colStr === "" || trigStr === "" || hdlStr === "") {
                            alert("Por favor, ingrese los valores de Colesterol Total, Triglicéridos y HDL.");
                            return;
                        }

                        let colTotal = parseFloat(colStr);
                        let trigliceridos = parseFloat(trigStr);
                        let hdl = parseFloat(hdlStr);

                        if (isNaN(colTotal) || isNaN(trigliceridos) || isNaN(hdl)) {
                            alert("Asegúrese de ingresar únicamente números válidos en los campos de texto.");
                            return;
                        }

                        let inputLDL = document.getElementById("txtLDL");
                        if (trigliceridos >= 400) {
                            alert("Los triglicéridos son iguales o mayores a 400 mg/dL.\nLa fórmula de Friedewald no es exacta. Se sugiere determinación directa.");
                            inputLDL.value = "Ver Nota";
                            inputLDL.dispatchEvent(new Event('input', { bubbles: true }));
                            return;
                        }

                        let ldl = colTotal - hdl - (trigliceridos / 5.0);
                        inputLDL.value = ldl < 0 ? "0.0" : ldl.toFixed(1);
                        inputLDL.dispatchEvent(new Event('input', { bubbles: true }));
                    } catch (e) {
                        alert("Asegúrese de ingresar únicamente números válidos en los campos de texto.");
                    }
                });
            }

            // 3. Cálculo Automático de Bilirrubinas
            const btnBili = document.getElementById("btnCalcularBilirrubinas");
            if (btnBili) {
                btnBili.addEventListener("click", function() {
                    try {
                        let totalStr = document.getElementById("txtBiliTotal").value.trim().replace(",", ".");
                        let directaStr = document.getElementById("txtBiliDirecta").value.trim().replace(",", ".");
                        let indirectaStr = document.getElementById("txtBiliIndirecta").value.trim().replace(",", ".");

                        let total = totalStr !== "" ? parseFloat(totalStr) : NaN;
                        let directa = directaStr !== "" ? parseFloat(directaStr) : NaN;
                        let indirecta = indirectaStr !== "" ? parseFloat(indirectaStr) : NaN;

                        let inputTotal = document.getElementById("txtBiliTotal");
                        let inputDirecta = document.getElementById("txtBiliDirecta");
                        let inputIndirecta = document.getElementById("txtBiliIndirecta");

                        if (!isNaN(total) && !isNaN(directa) && isNaN(indirecta)) {
                            let calcInd = total - directa;
                            inputIndirecta.value = calcInd < 0 ? "0.00" : calcInd.toFixed(2);
                            inputIndirecta.dispatchEvent(new Event('input', { bubbles: true }));
                        } else if (!isNaN(total) && isNaN(directa) && !isNaN(indirecta)) {
                            let calcDir = total - indirecta;
                            inputDirecta.value = calcDir < 0 ? "0.00" : calcDir.toFixed(2);
                            inputDirecta.dispatchEvent(new Event('input', { bubbles: true }));
                        } else if (isNaN(total) && !isNaN(directa) && !isNaN(indirecta)) {
                            let calcTot = directa + indirecta;
                            inputTotal.value = calcTot.toFixed(2);
                            inputTotal.dispatchEvent(new Event('input', { bubbles: true }));
                        } else {
                            alert("Por favor, ingrese al menos dos valores de bilirrubina para calcular el faltante.");
                        }
                    } catch (e) {
                        alert("Error al procesar el cálculo de bilirrubinas. Verifique los números ingresados.");
                    }
                });
            }

            // 4. Secciones Colapsables
            inicializarSeccionesColapsables();

            // 5. Modo Claro / Oscuro y Glare de la Barra Liquid Glass
            const themeBtn = document.getElementById("theme-btn");
            const nav = document.getElementById("nav");
            const glare = document.getElementById("glare");

            if (themeBtn && !themeBtn.dataset.listener) {
                themeBtn.dataset.listener = "true";
                themeBtn.addEventListener("click", () => {
                    const root = document.documentElement;
                    const isDark = root.getAttribute("data-theme") === "dark";
                    root.setAttribute("data-theme", isDark ? "light" : "dark");
                });
            }

            if (nav && glare && !nav.dataset.listener) {
                nav.dataset.listener = "true";
                nav.addEventListener("mousemove", (e) => {
                    const rect = nav.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    glare.style.setProperty("--x", `${x}px`);
                    glare.style.setProperty("--y", `${y}px`);
                });
            }

            actualizarTablaDinamica();
        });

        function inicializarSeccionesColapsables() {
            if (!document.getElementById('estilos-colapsables')) {
                const style = document.createElement('style');
                style.id = 'estilos-colapsables';
                style.innerHTML = `
                    .section-title {
                        cursor: pointer;
                        transition: background-color 0.2s ease, color 0.2s ease;
                        padding: 6px 10px;
                        border-radius: 4px;
                        user-select: none;
                    }
                    .section-title:hover {
                        background-color: #e9ecef !important;
                        color: #0d6efd !important;
                    }
                `;
                document.head.appendChild(style);
            }

            const titulosSeccion = document.querySelectorAll('.section-title');
            titulosSeccion.forEach(tituloElem => {
                const targetId = tituloElem.getAttribute('data-target');
                let seccionContenido = targetId ? document.getElementById(targetId) : tituloElem.nextElementSibling;

                if (seccionContenido) {
                    seccionContenido.style.display = "none";
                }

                let textoLimpio = tituloElem.textContent.replace(/[▼▲]/g, '').trim();
                tituloElem.innerHTML = `<span class="flecha-indicador">▼</span> ${textoLimpio}`;

                tituloElem.addEventListener("click", () => {
                    let contenidoAsociado = targetId ? document.getElementById(targetId) : tituloElem.nextElementSibling;
                    if (contenidoAsociado) {
                        let estaOculto = (contenidoAsociado.style.display === "none");
                        contenidoAsociado.style.display = estaOculto ? "block" : "none";
                        let indicador = tituloElem.querySelector('.flecha-indicador');
                        if (indicador) indicador.innerText = estaOculto ? "▲" : "▼";
                    }
                });
            });
        }

        // Función de Impresión Directa con bloque visual de paciente corregido
        function imprimirResultados() {
            actualizarTablaDinamica();
            const bloqueImpresion = document.getElementById("bloquePacienteImpresion");
            const tarjetaEditable = document.querySelector(".card.p-2.mb-2.bg-light.border.no-print");
            
            if (bloqueImpresion) bloqueImpresion.classList.remove("d-none");
            if (tarjetaEditable) tarjetaEditable.style.display = "none";

            const contenedor = document.getElementById("pedidoContainer");
            procesarSelectsParaImpresion(contenedor, true);
            
            window.print();
            
            setTimeout(() => {
                procesarSelectsParaImpresion(contenedor, false);
                if (bloqueImpresion) bloqueImpresion.classList.add("d-none");
                if (tarjetaEditable) tarjetaEditable.style.display = "";
            }, 1000);
        }

        // Función de Descarga en PDF
        async function descargarPDFResultados() {
            actualizarTablaDinamica();
            
            let orden = document.getElementById('idOrden')?.value.trim() || "1000";
            let nombrePaciente = document.getElementById('nombrePaciente')?.value.trim() || "PACIENTE";
            nombrePaciente = nombrePaciente.toUpperCase().replace(/\s+/g, '');

            let fechaVal = document.getElementById('fechaActual')?.value.trim();
            let fechaFormateada = "";

            if (fechaVal) {
                let partes = fechaVal.split('-');
                if (partes.length === 3) {
                    fechaFormateada = `${partes[2]}-${partes[1]}-${partes[0]}`;
                } else {
                    fechaFormateada = fechaVal.replace(/\//g, '-');
                }
            } else {
                let hoy = new Date();
                fechaFormateada = `${String(hoy.getDate()).padStart(2, '0')}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${hoy.getFullYear()}`;
            }

            let nombreArchivoFinal = `${orden}_${nombrePaciente}_${fechaFormateada}.pdf`;

            const bloqueImpresion = document.getElementById("bloquePacienteImpresion");
            if (bloqueImpresion) bloqueImpresion.classList.remove("d-none");

            const elementoOriginal = document.getElementById("pedidoContainer");
            if (!elementoOriginal) return;
            const elementoClonado = elementoOriginal.cloneNode(true);

            procesarSelectsParaImpresion(elementoClonado, true);
            elementoClonado.querySelectorAll('.no-print').forEach(el => el.remove());
            if (bloqueImpresion) bloqueImpresion.classList.add("d-none");

            const opciones = {
                margin:       5,
                filename:     nombreArchivoFinal,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            if (typeof html2pdf === "undefined") {
                alert("La librería html2pdf no está cargada.");
                return;
            }

            html2pdf().from(elementoClonado).set(opciones).outputPdf('blob').then(async (pdfBlob) => {
                try {
                    if ('showDirectoryPicker' in window) {
                        const handlePrincipal = await window.showDirectoryPicker();
                        const handleReportes = await handlePrincipal.getDirectoryHandle('Reportes', { create: true });
                        const handleCarpetaFecha = await handleReportes.getDirectoryHandle(fechaFormateada, { create: true });

                        let archivoExiste = false;
                        try {
                            await handleCarpetaFecha.getFileHandle(nombreArchivoFinal);
                            archivoExiste = true;
                        } catch (err) {
                            archivoExiste = false;
                        }

                        if (archivoExiste) {
                            const reemplazar = confirm(`El archivo "${nombreArchivoFinal}" ya existe en Reportes/${fechaFormateada}.\n¿Desea reemplazarlo?`);
                            if (!reemplazar) {
                                alert("Operación cancelada. No se sobrescribió el archivo.");
                                return;
                            }
                        }

                        const archivoHandle = await handleCarpetaFecha.getFileHandle(nombreArchivoFinal, { create: true });
                        const writableStream = await archivoHandle.createWritable();
                        await writableStream.write(pdfBlob);
                        await writableStream.close();

                        alert(`¡PDF guardado exitosamente en la ruta: Reportes/${fechaFormateada}/${nombreArchivoFinal}!`);
                        window.open(URL.createObjectURL(pdfBlob), '_blank');
                    } else {
                        html2pdf().from(elementoClonado).set(opciones).save();
                        window.open(URL.createObjectURL(pdfBlob), '_blank');
                    }
                } catch (error) {
                    console.error("Error al gestionar carpetas:", error);
                }
            });
        }

        async function enviarCorreoResultado() {
            const txtMail = document.getElementById('txtMail');
            const correoDestino = txtMail ? txtMail.value.trim() : "";
            
            if (correoDestino === "" || !correoDestino.includes("@")) {
                alert("Por favor ingrese un correo electrónico válido.");
                return;
            }

            if (!confirm("¿Desea enviar el reporte en PDF al correo del paciente: " + correoDestino + "?")) return;
            alert("El envío ha comenzado, por favor espere un momento...");

            actualizarTablaDinamica();
            let orden = document.getElementById('idOrden')?.value.trim() || "1000";
            let nombrePaciente = document.getElementById('nombrePaciente')?.value.trim() || "PACIENTE";
            nombrePaciente = nombrePaciente.toUpperCase().replace(/\s+/g, '');
            let nombreArchivoFinal = `${orden}_${nombrePaciente}.pdf`;

            const bloqueImpresion = document.getElementById("bloquePacienteImpresion");
            if (bloqueImpresion) bloqueImpresion.classList.remove("d-none");

            const elementoOriginal = document.getElementById("pedidoContainer");
            const elementoClonado = elementoOriginal.cloneNode(true);
            procesarSelectsParaImpresion(elementoClonado, true);
            elementoClonado.querySelectorAll('.no-print').forEach(el => el.remove());
            if (bloqueImpresion) bloqueImpresion.classList.add("d-none");

            const opciones = {
                margin: 5, filename: nombreArchivoFinal,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().from(elementoClonado).set(opciones).outputPdf('datauristring').then(async (pdfBase64) => {
                try {
                    let response = await fetch('../EnviarCorreo', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: correoDestino, pdfBase64: pdfBase64, nombreArchivo: nombreArchivoFinal })
                    });
                    if (response.ok) alert("¡Correo enviado exitosamente con el PDF adjunto!");
                    else throw new Error(await response.text() || "Error en el servidor");
                } catch (error) {
                    alert("Hubo un error al enviar el correo: " + error.message);
                }
            });
        }

        function enviarWhatsAppResultado() {
            let telefonoInput = document.getElementById('telefonoPaciente')?.value.trim() || "";
            let nombrePaciente = document.getElementById('nombrePaciente')?.value.trim() || "PACIENTE";
            let orden = document.getElementById('idOrden')?.value.trim() || "XXXX";
            let soloNumeros = telefonoInput.replace(/\D/g, '');

            if (soloNumeros === "") {
                alert("Por favor ingrese un número de teléfono válido para el paciente.");
                return;
            }

            let telefonoFormateado = soloNumeros.startsWith('593') ? '+' + soloNumeros : (soloNumeros.startsWith('0') ? '+593' + soloNumeros.substring(1) : '+593' + soloNumeros);
            let mensaje = `Laboratorio Clínico Biosalud la Magdalena Resultado del paciente ${nombrePaciente} codigo ${orden} telefono ${telefonoFormateado}`;
            window.open(`https://wa.me/${telefonoFormateado.replace('+', '')}?text=${encodeURIComponent(mensaje)}`, '_blank');
        }

        function guardarOActualizarPaciente() {
            let nombrePaciente = document.getElementById('nombrePaciente')?.value.trim();
            let orden = document.getElementById('idOrden')?.value.trim();

            if (!nombrePaciente || !orden) {
                alert("Por favor asegúrese de al menos ingresar el Nombre del Paciente y el Número de Orden antes de guardar.");
                return;
            }

            setTimeout(() => {
                alert(`¡Paciente "${nombrePaciente}" (Orden N° ${orden}) guardado / actualizado correctamente!`);
                let inputOrden = document.getElementById('idOrden');
                if (inputOrden) { inputOrden.focus(); inputOrden.select(); }
            }, 300);
        }

        function nuevoPaciente() {
            if (confirm("¿Desea limpiar el formulario para registrar un nuevo paciente? Se perderán los datos no guardados.")) {
                document.querySelectorAll('input, select, textarea').forEach(element => {
                    if (element.type === 'checkbox' || element.type === 'radio') element.checked = false;
                    else element.value = '';
                });

                let inputFecha = document.getElementById('fechaActual');
                if (inputFecha) {
                    inputFecha.value = new Date().toISOString().split('T')[0];
                }
                actualizarTablaDinamica();
                alert("Formulario listo para un nuevo paciente.");
            }
        }

        function toggleFirmas() {
            const btn = document.getElementById("btnToggleFirmas");
            const contenedorFirmas = document.getElementById("contenedorFirmas");
            const isActive = btn.classList.toggle("active");
            
            if (contenedorFirmas) {
                const imagenes = contenedorFirmas.querySelectorAll("img");
                imagenes.forEach(img => {
                    img.style.display = isActive ? "inline-block" : "none";
                });
                btn.title = isActive ? "Firmas Digitales (Activo)" : "Espacio para Firma a Mano (Activo)";
            }
        }