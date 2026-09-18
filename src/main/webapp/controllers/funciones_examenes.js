/**
 * Captura todos los campos de la pantalla y arma el array de objetos con los resultados.
 */
function capturarResultadosLaboratorio() {
    const idOrdenVal = document.getElementById('idOrden')?.value.trim() || '';

    const datosPaciente = {
        id_orden: idOrdenVal,
        cod_doc: document.getElementById('codDoc')?.value.trim() || document.getElementById('cedulaPaciente')?.value.trim() || '',
        nombre_paciente: document.getElementById('nombrePaciente')?.value.trim() || '',
        fecha_nacimiento: document.getElementById('fechaNacimiento')?.value.trim() || '',
        edad: document.getElementById('edadPaciente')?.value.trim() || '',
        fecha_registro: document.getElementById('fechaActual')?.value.trim() || '',
        sexo: document.getElementById('sexoPaciente')?.value.trim() || '',
        telefono: document.getElementById('telefonoPaciente')?.value.trim() || ''
    };

    const listaRegistros = [];

    // Recorrer pestañas/secciones de exámenes
    const secciones = document.querySelectorAll('.tab-pane');

    secciones.forEach(seccion => {
        const tituloCategoria = seccion.querySelector('.section-title')?.getAttribute('data-section-name') || 
                               seccion.querySelector('.section-title')?.textContent.trim() || 'GENERAL';

        const filas = seccion.querySelectorAll('table tbody tr');

        filas.forEach(fila => {
            const celdas = fila.querySelectorAll('td');
            if (celdas.length < 2) return; // Omitir encabezados de sección

            const campoResultado = celdas[1]?.querySelector('input, select');
            const resultadoVal = campoResultado ? campoResultado.value.trim() : celdas[1]?.textContent.trim();

            // Solo procesar filas con datos válidos
            if (resultadoVal !== '' && resultadoVal !== '-') {

                // Obtener Nombre del Examen
                let nombreExamen = '';
                const inputNombreCustom = celdas[0]?.querySelector('input[id^="nombreExamen"]');
                
                if (inputNombreCustom && inputNombreCustom.value.trim() !== '') {
                    nombreExamen = inputNombreCustom.value.trim();
                } else {
                    const clonNombre = celdas[0].cloneNode(true);
                    clonNombre.querySelectorAll('input, select, button').forEach(el => el.remove());
                    nombreExamen = clonNombre.textContent.trim();
                }

                // Obtener Unidad
                let unidadVal = '';
                if (celdas[2]) {
                    const campoUnidad = celdas[2].querySelector('input, select');
                    unidadVal = campoUnidad ? campoUnidad.value.trim() : celdas[2].textContent.trim();
                }

                // Obtener Valores de Referencia
                let refVal = '';
                if (celdas[3]) {
                    const campoRef = celdas[3].querySelector('input, select');
                    refVal = campoRef ? campoRef.value.trim() : celdas[3].textContent.trim();
                }

                listaRegistros.push({
                    ...datosPaciente,
                    categoria: tituloCategoria,
                    nombre_examen: nombreExamen,
                    resultado: resultadoVal,
                    unidad: unidadVal,
                    valores_referencia: refVal
                });
            }
        });
    });

    return listaRegistros;
}

/**
 * Función vinculada al botón "Guardar en la Nube".
 * Permite tanto INSERTAR como ACTUALIZAR en la base de datos.
 */
async function guardarEnBaseDeDatos() {
    const idOrden = document.getElementById('idOrden')?.value.trim() || '';
    
    if (!idOrden) {
        alert('Ingrese o seleccione un ID de Orden antes de guardar.');
        return;
    }

    let datosAGuardar = capturarResultadosLaboratorio();

    // Si no hay resultados escritos pero la orden existe, confirma si desea vaciar la orden en la BD
    if (datosAGuardar.length === 0) {
        const confirmar = confirm(`No hay ningún resultado ingresado en pantalla. ¿Desea eliminar todos los resultados previos de la orden ${idOrden}?`);
        if (!confirmar) return;

        datosAGuardar = [{
            id_orden: idOrden,
            eliminar_todos: true
        }];
    }

    const btnGuardar = document.querySelector('button[onclick="guardarEnBaseDeDatos()"]');
    if (btnGuardar) btnGuardar.disabled = true;

    try {
        const respuesta = await fetch('/GuardarResultadosServlet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify(datosAGuardar)
        });

        const resData = await respuesta.json().catch(() => ({}));

        if (respuesta.ok && resData.status === 'success') {
            alert(resData.message || '¡Resultados sincronizados correctamente en la base de datos!');
        } else {
            alert('Error: ' + (resData.message || 'No se pudo procesar la solicitud.'));
        }
    } catch (error) {
        console.error('Error de comunicación:', error);
        alert('No se pudo establecer conexión con el servidor.');
    } finally {
        if (btnGuardar) btnGuardar.disabled = false;
    }
}

/**
 * Busca los resultados de una orden por su ID y llena el formulario.
 */
/**
 * Busca los resultados de una orden por su ID y llena el formulario.
 * Sin mensajes o alertas en pantalla.
 */
async function buscarOrden(idOrden) {
    if (!idOrden || idOrden.trim() === '') return;

    try {
        const response = await fetch(`/BuscarResultadosServlet?id_orden=${encodeURIComponent(idOrden.trim())}`);
        
        if (!response.ok) return;

        const resultados = await response.json();

        // Verificar si los datos son válidos y contienen registros
        if (!Array.isArray(resultados) || resultados.length === 0 || resultados.status === 'error') {
            return; // Sale silenciosamente sin mostrar alertas
        }

        llenarFormularioResultados(resultados);

    } catch (error) {
        console.error("Error al buscar orden:", error);
    }
}

/**
 * Mapea la información obtenida de la BD a los campos correspondientes de la interfaz.
 */
function llenarFormularioResultados(resultados) {
    if (!Array.isArray(resultados) || resultados.length === 0) return;

    const p = resultados[0];

    // Llenar datos generales del paciente
    if (document.getElementById('idOrden')) document.getElementById('idOrden').value = p.id_orden || '';
    if (document.getElementById('codDoc')) document.getElementById('codDoc').value = p.cod_doc || '';
    if (document.getElementById('cedulaPaciente')) document.getElementById('cedulaPaciente').value = p.cod_doc || '';
    if (document.getElementById('nombrePaciente')) document.getElementById('nombrePaciente').value = p.nombre_paciente || '';
    if (document.getElementById('edadPaciente')) document.getElementById('edadPaciente').value = p.edad || '';
    if (document.getElementById('fechaActual')) document.getElementById('fechaActual').value = p.fecha_registro || '';
    if (document.getElementById('sexoPaciente')) document.getElementById('sexoPaciente').value = p.sexo || '';
    if (document.getElementById('telefonoPaciente')) document.getElementById('telefonoPaciente').value = p.telefono || '';

    // Formatear Fecha de Nacimiento
    if (p.fecha_nacimiento && document.getElementById('fechaNacimiento')) {
        const fechaLimpia = p.fecha_nacimiento.split('T')[0].split(' ')[0];
        document.getElementById('fechaNacimiento').value = fechaLimpia;
    }

    // Actualizar vista previa visual para impresión
    if (document.getElementById('txtIdOrdenVisual')) document.getElementById('txtIdOrdenVisual').innerText = p.id_orden || '';
    if (document.getElementById('txtCodDocVisual')) document.getElementById('txtCodDocVisual').innerText = p.cod_doc || '';
    if (document.getElementById('txtNombreVisual')) document.getElementById('txtNombreVisual').innerText = p.nombre_paciente || '';
    if (document.getElementById('txtFechaNacVisual')) document.getElementById('txtFechaNacVisual').innerText = p.fecha_nacimiento || '';
    if (document.getElementById('txtEdadVisual')) document.getElementById('txtEdadVisual').innerText = p.edad || '';
    if (document.getElementById('txtFechaActualVisual')) document.getElementById('txtFechaActualVisual').innerText = p.fecha_registro || '';
    if (document.getElementById('txtSexoVisual')) document.getElementById('txtSexoVisual').innerText = p.sexo || '';
    if (document.getElementById('txtTelVisual')) document.getElementById('txtTelVisual').innerText = p.telefono || '';

    // Mapeo de Exámenes
    resultados.forEach(item => {
        if (!item.nombre_examen) return;

        const nombreLimpio = item.nombre_examen.trim();

        // 1. Asignar por ID directo
        const inputPorId = document.getElementById(nombreLimpio);
        if (inputPorId) {
            inputPorId.value = item.resultado || '';
            inputPorId.dispatchEvent(new Event('input', { bubbles: true }));
            inputPorId.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 2. Asignar por coincidencia de texto en la tabla
        document.querySelectorAll('table tbody tr').forEach(row => {
            const celdaNombre = row.querySelector('td:first-child');
            const inputResultado = row.querySelector('input, select');

            if (celdaNombre && inputResultado) {
                if (celdaNombre.innerText.trim().toUpperCase() === nombreLimpio.toUpperCase()) {
                    inputResultado.value = item.resultado || '';
                    inputResultado.dispatchEvent(new Event('input', { bubbles: true }));
                    inputResultado.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        });
    });

    if (typeof actualizarTablaResultadosRegistrados === 'function') {
        actualizarTablaResultadosRegistrados();
    }
}
