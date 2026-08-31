document.addEventListener("DOMContentLoaded", () => {
    const themeBtn = document.getElementById("theme-btn");
    const nav = document.getElementById("nav");
    const glare = document.getElementById("glare");

    // Lógica para alternar el Modo Claro / Oscuro
    if (themeBtn && !themeBtn.dataset.listener) {
        themeBtn.dataset.listener = "true";
        themeBtn.addEventListener("click", () => {
            const root = document.documentElement;
            const isDark = root.getAttribute("data-theme") === "dark";
            root.setAttribute("data-theme", isDark ? "light" : "dark");
        });
    }

    // Efecto de brillo interactivo que sigue el movimiento del mouse sobre la barra
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
});



// Función para alternar el estado de las firmas digitales
// Función para alternar entre mostrar firmas digitales o dejar espacio manual
function toggleFirmas() {
    const btn = document.getElementById("btnToggleFirmas");
    const contenedorFirmas = document.getElementById("contenedorFirmas");
    
    // Alterna la clase active en el botón de la barra
    const isActive = btn.classList.toggle("active");
    
    if (contenedorFirmas) {
        if (isActive) {
            // Si está activo, muestra las imágenes de las firmas / QR digitales
            btn.title = "Firmas Digitales (Activo)";
            contenedorFirmas.style.visibility = "visible";
            contenedorFirmas.style.opacity = "1";
            contenedorFirmas.style.height = "auto";
            
            // Opcional: Si el contenido interno se ocultaba por completo
            const imagenes = contenedorFirmas.querySelectorAll("img");
            imagenes.forEach(img => img.style.display = "inline-block");
        } else {
            // Si se desmarca, oculta las imágenes pero MANTIENE EL ESPACIO (invisible) para firmar a mano
            btn.title = "Espacio para Firma a Mano (Activo)";
            
            // Ocultamos solo las imágenes/QR pero respetamos el contenedor y las líneas divisorias <hr>
            const imagenes = contenedorFirmas.querySelectorAll("img");
            imagenes.forEach(img => img.style.display = "none");
        }
    }
}