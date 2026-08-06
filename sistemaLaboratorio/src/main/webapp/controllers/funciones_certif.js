// Autocompletar fecha actual al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0');
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const anio = hoy.getFullYear();
    const fechaActual = `${dia}/${mes}/${anio}`;

    const inputFecha = document.getElementById('fechaActual');
    if (inputFecha) {
        inputFecha.value = fechaActual;
    }
});

// Función 1: Mostrar u ocultar las firmas manteniendo el espacio
function toggleFirmas() {
    const check = document.getElementById('checkFirmas');
    if (!check) return;
    
    const activo = check.checked;
    const opacityValue = activo ? '1' : '0';
    
    const firma1 = document.getElementById('imgFirma1');
    const firma2 = document.getElementById('imgFirma2');
    
    if (firma1) firma1.style.opacity = opacityValue;
    if (firma2) firma2.style.opacity = opacityValue;
}

// Función 2: Generar código de barras solo con el ID de orden y la fecha, e imprimir
function generarPDFYImprimir() {
    const idOrden = document.getElementById('idOrden').value.trim();
    const fechaActual = document.getElementById('fechaActual').value.trim();
    const textoBarcode = `${fechaActual} - ${idOrden}`;

    try {
        JsBarcode("#codigoBarras", textoBarcode, {
            format: "CODE128",
            lineColor: "#000",
            width: 1.5,
            height: 40,
            displayValue: true,
            fontSize: 11
        });
    } catch (e) {
        console.error("Error al generar código de barras", e);
    }

    setTimeout(() => {
        window.print();
    }, 300);
}