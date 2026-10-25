/**
 * ASISTENTE DE VOZ INTELIGENTE - LABORATORIO CLÍNICO
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// Estados de la conversación interactiva
let estadoConversacion = 'IDLE'; // 'IDLE', 'ESPERANDO_CONFIRMACION', 'ESPERANDO_SUB_OPCION'
let temporizadorInactividad = null;
let tabActivaNombre = '';
let tabActivaId = '';
let ultimoTextoHablado = ''; // Almacena lo último que dijo el asistente para la opción "repite"

// Subopciones numeradas asociadas a cada pestaña principal
const subOpcionesTabs = {
    'hematologia': [
        { numero: '1', nombre: 'Hematología Automatizada Dirui', idTab: 'auto-tab' },
        { numero: '2', nombre: 'Hematología Pediátrica Dirui', idTab: 'pediatrico-tab' },
        { numero: '3', nombre: 'Hematología Manual', idTab: 'manual-tab' },
        { numero: '4', nombre: 'VES', idTab: 'ves-tab' }
    ],
    'qs': [
        { numero: '1', nombre: 'Química Sanguínea General', idTab: 'qs-tab' }
    ],
    'hepaticas': [
        { numero: '1', nombre: 'Perfil Hepático', idTab: 'hepaticas-tab' }
    ],
    'electrolitos': [
        { numero: '1', nombre: 'Electrolitos', idTab: 'electrolitos-tab' }
    ],
    'endocrinologia': [
        { numero: '1', nombre: 'Endocrinología', idTab: 'endocrinologia-tab' }
    ],
    'inmunologicos': [
        { numero: '1', nombre: 'Inmunológicos', idTab: 'inmunologicos-tab' }
    ],
    'coagulacion': [
        { numero: '1', nombre: 'Coagulación', idTab: 'coagulacion-tab' }
    ],
    'oncologicos': [
        { numero: '1', nombre: 'Oncológicos', idTab: 'oncologicos-tab' }
    ],
    'reumatologico': [
        { numero: '1', nombre: 'Reumatológico', idTab: 'reumatologico-tab' }
    ],
    'otros': [
        { numero: '1', nombre: 'Otros BHCG y GyF', idTab: 'otros-tab' }
    ],
    'vitaminas': [
        { numero: '1', nombre: 'Vitaminas', idTab: 'vitaminas-tab' }
    ],
    'orina': [
        { numero: '1', nombre: 'Orina', idTab: 'orina-tab' }
    ],
    'heces': [
        { numero: '1', nombre: 'Heces', idTab: 'heces-tab' }
    ],
    'cultivos': [
        { numero: '1', nombre: 'Cultivos', idTab: 'cultivos-tab' }
    ],
    'secreciones': [
        { numero: '1', nombre: 'Secreciones', idTab: 'secreciones-tab' }
    ],
    'covid': [
        { numero: '1', nombre: 'Covid', idTab: 'covid-tab' }
    ],
    'comentario': [
        { numero: '1', nombre: 'Comentario', idTab: 'comentario-tab' }
    ]
};

const btnVoz = document.getElementById('btnVozGlobal');
const estadoVoz = document.getElementById('estadoVoz');

// Función de Síntesis de Voz (Voz Femenina)
function hablarTextoYEscuchar(texto, callbackCuandoTermine) {
    ultimoTextoHablado = texto; // Guardar para el comando "repite"
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;

        const voces = window.speechSynthesis.getVoices();
        const vozFemenina = voces.find(v => 
            v.lang.toLowerCase().startsWith('es') && 
            (v.name.toLowerCase().includes('female') || 
             v.name.toLowerCase().includes('elena') || 
             v.name.toLowerCase().includes('monica') || 
             v.name.toLowerCase().includes('paulina') || 
             v.name.toLowerCase().includes('lucia') || 
             v.name.toLowerCase().includes('google español') ||
             v.name.toLowerCase().includes('sabrina'))
        );

        if (vozFemenina) {
            utterance.voice = vozFemenina;
        }

        utterance.onend = () => {
            if (callbackCuandoTermine) callbackCuandoTermine();
        };

        window.speechSynthesis.speak(utterance);
    } else {
        if (callbackCuandoTermine) callbackCuandoTermine();
    }
}

if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.getVoices(); };
}

function normalizarTexto(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function convertirTextoAFecha(texto) {
    let numeros = texto.match(/\d+/g);
    if (!numeros || numeros.length < 3) return null;
    let n1 = parseInt(numeros[0], 10);
    let n2 = parseInt(numeros[1], 10);
    let n3 = parseInt(numeros[2], 10);
    let anio, mes, dia;
    if (n1 > 1000) { anio = n1; mes = n2; dia = n3; } 
    else { dia = n1; mes = n2; anio = n3; if (anio < 100) anio += 2000; }
    return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

// Temporizador estricto de 10 segundos de inactividad
function iniciarTemporizador10Seg() {
    clearTimeout(temporizadorInactividad);
    temporizadorInactividad = setTimeout(() => {
        if (estadoConversacion !== 'IDLE') {
            hablarTextoYEscuchar("Tiempo agotado sin respuesta. Cerrando micrófono.", () => {
                estadoConversacion = 'IDLE';
                restaurarBotonVozVisual();
                if (recognition) {
                    try { recognition.stop(); } catch(e){}
                }
            });
        }
    }, 10000); // 10 segundos
}

function restaurarBotonVozVisual() {
    if (btnVoz) {
        btnVoz.classList.remove('btn-danger');
        btnVoz.classList.add('btn-primary');
    }
    if (estadoVoz) {
        setTimeout(() => { estadoVoz.style.display = 'none'; }, 2000);
    }
}

let recognition = null;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    btnVoz.addEventListener('click', () => {
        try {
            window.speechSynthesis.cancel();
            clearTimeout(temporizadorInactividad);
            estadoConversacion = 'IDLE';
            iniciarEscuchaManual();
        } catch (e) {
            console.error(e);
        }
    });

    recognition.onresult = (event) => {
        clearTimeout(temporizadorInactividad);
        const fraseCruda = event.results[0][0].transcript;
        const frase = normalizarTexto(fraseCruda);
        if (estadoVoz) estadoVoz.textContent = `Ok ✔️`;
        
        procesarFlujoConversacional(frase, fraseCruda);
    };

    recognition.onspeechend = () => {
        recognition.stop();
        restaurarBotonVozVisual();
    };

    recognition.onerror = () => {
        if (estadoVoz) estadoVoz.textContent = "Error";
        restaurarBotonVozVisual();
        estadoConversacion = 'IDLE';
    };
} else {
    if (btnVoz) btnVoz.style.display = 'none';
}

function iniciarEscuchaManual() {
    try {
        recognition.start();
        if (estadoVoz) {
            estadoVoz.style.display = 'block';
            estadoVoz.textContent = "Escuchando... 🎙️";
        }
        btnVoz.classList.remove('btn-primary', 'btn-success');
        btnVoz.classList.add('btn-danger');
        iniciarTemporizador10Seg(); // Activa cuenta regresiva al escuchar
    } catch (err) {
        console.log(err);
    }
}

// Procesador Inteligente de Comandos y Flujo
function procesarFlujoConversacional(frase, fraseCruda) {
    
    // Comando para repetir lo último dicho
    if (frase.includes('repite') || frase.includes('repetir')) {
        iniciarTemporizador10Seg();
        hablarTextoYEscuchar(ultimoTextoHablado, () => {
            iniciarEscuchaManual();
        });
        return;
    }

    // 1. Esperando Confirmación (Sí / No)
    if (estadoConversacion === 'ESPERANDO_CONFIRMACION') {
        if (frase.includes('si') || frase.includes('ingresar') || frase.includes('claro')) {
            let subOps = subOpcionesTabs[tabActivaId] || [{ numero: '1', nombre: 'General' }];
            let textoOpcionesLista = subOps.map(op => `${op.numero}, ${op.nombre}`).join('. ');
            
            estadoConversacion = 'ESPERANDO_SUB_OPCION';
            iniciarTemporizador10Seg();
            
            hablarTextoYEscuchar(`¿Qué subopción deseas? Las opciones son: ${textoOpcionesLista}. Di el número o el nombre.`, () => {
                iniciarEscuchaManual();
                iniciarTemporizador10Seg();
            });
        } else if (frase.includes('no')) {
            estadoConversacion = 'IDLE';
            hablarTextoYEscuchar("Operación cancelada.");
            restaurarBotonVozVisual();
        } else {
            iniciarTemporizador10Seg();
            hablarTextoYEscuchar("Por favor responde sí o no.", () => {
                iniciarEscuchaManual();
                iniciarTemporizador10Seg();
            });
        }
        return;
    }

    // 2. Esperando Selección de Subopción por Número o Nombre
    if (estadoConversacion === 'ESPERANDO_SUB_OPCION') {
        let subOps = subOpcionesTabs[tabActivaId] || [];
        let encontrada = subOps.find(op => frase.includes(op.numero) || normalizarTexto(op.nombre).includes(frase) || frase.includes(normalizarTexto(op.nombre)));
        
        estadoConversacion = 'IDLE';
        restaurarBotonVozVisual();

        if (encontrada) {
            // Activar la sub-pestaña correspondiente en Bootstrap de manera visual si existe
            let elSubTab = document.getElementById(encontrada.idTab);
            if (elSubTab) {
                let bsTab = new bootstrap.Tab(elSubTab);
                bsTab.show();
            }
            hablarTextoYEscuchar(`Perfecto, ingresando en ${encontrada.nombre}. Dicta el valor.`);
        } else {
            hablarTextoYEscuchar("No reconocí esa opción.");
        }
        return;
    }

    // 3. Comando Principal: "Ingresar resultados"
    if (frase.includes('ingresar resultado') || frase.includes('ingresar resultados')) {
        let tabActivaBtn = document.querySelector('#mainTabs .nav-link.active');
        if (tabActivaBtn) {
            tabActivaNombre = tabActivaBtn.textContent.trim();
            let idTabHtml = tabActivaBtn.id;
            tabActivaId = Object.keys(subOpcionesTabs).find(k => idTabHtml.includes(k)) || 'otros';
        } else {
            tabActivaNombre = "la opción actual";
            tabActivaId = "otros";
        }

        estadoConversacion = 'ESPERANDO_CONFIRMACION';
        iniciarTemporizador10Seg();
        
        hablarTextoYEscuchar(`Estás en ${tabActivaNombre}. ¿Quieres ingresar resultado? Di sí o no.`, () => {
            iniciarEscuchaManual();
            iniciarTemporizador10Seg();
        });
        return;
    }

    // 4. Datos del Paciente y Navegación Normal de Pestañas
    if (frase.includes('cedula') || frase.includes('documento')) {
        let valor = extraerTextoDespues(fraseCruda, ['cédula', 'cedula', 'documento']);
        if (valor) {
            document.getElementById('codDoc').value = valor;
            document.getElementById('txtCodDocVisual').textContent = valor;
            hablarTextoYEscuchar(`Cédula ingresada: ${valor}`);
        }
    } 
    else if (frase.includes('orden')) {
        let valor = extraerTextoDespues(fraseCruda, ['orden número', 'orden numero', 'orden']);
        if (valor) {
            let valorNumerico = valor.replace(/\D/g, '');
            document.getElementById('idOrden').value = valorNumerico;
            document.getElementById('txtIdOrdenVisual').textContent = valorNumerico;
            if (typeof buscarOrden === 'function') buscarOrden(valorNumerico);
            hablarTextoYEscuchar(`Orden número ${valorNumerico}`);
        }
    } 
    else if (frase.includes('nombre')) {
        let valor = extraerTextoDespues(fraseCruda, ['nombres y apellidos', 'nombres', 'nombre']);
        if (valor) {
            let nombreMayus = valor.toUpperCase();
            document.getElementById('nombrePaciente').value = nombreMayus;
            document.getElementById('txtNombreVisual').textContent = nombreMayus;
            hablarTextoYEscuchar(`Nombres: ${nombreMayus}`);
        }
    } 
    else if (frase.includes('edad')) {
        let valor = extraerTextoDespues(fraseCruda, ['edad']);
        if (valor) {
            let numEdad = valor.replace(/\D/g, '');
            document.getElementById('edadPaciente').value = numEdad + ' años';
            document.getElementById('txtEdadVisual').textContent = numEdad + ' años';
            hablarTextoYEscuchar(`Edad: ${numEdad} años`);
        }
    } 
    else if (frase.includes('nacimiento')) {
        let textoFecha = extraerTextoDespues(fraseCruda, ['fecha de nacimiento', 'nacimiento']);
        let fechaFormateada = convertirTextoAFecha(textoFecha);
        if (fechaFormateada) {
            document.getElementById('fechaNacimiento').value = fechaFormateada;
            document.getElementById('txtFechaNacVisual').textContent = fechaFormateada;
            hablarTextoYEscuchar(`Fecha de nacimiento registrada`);
        } else {
            hablarTextoYEscuchar(`No pude entender la fecha. Intente decir por ejemplo: nacimiento 15 05 1990`);
        }
    } 
    else if (frase.includes('sexo') || frase.includes('genero')) {
        let selectSexo = document.getElementById('sexoPaciente');
        if (frase.includes('femenino')) {
            selectSexo.value = 'Femenino';
            document.getElementById('txtSexoVisual').textContent = 'Femenino';
            hablarTextoYEscuchar("Sexo Femenino seleccionado");
        } else if (frase.includes('masculino')) {
            selectSexo.value = 'Masculino';
            document.getElementById('txtSexoVisual').textContent = 'Masculino';
            hablarTextoYEscuchar("Sexo Masculino seleccionado");
        }
    } 
    else if (frase.includes('telefono')) {
        let valor = extraerTextoDespues(fraseCruda, ['teléfono', 'telefono']);
        if (valor) {
            document.getElementById('telefonoPaciente').value = valor;
            document.getElementById('txtTelVisual').textContent = valor;
            hablarTextoYEscuchar(`Teléfono guardado`);
        }
    }
    else {
        navegarPestanaExamenPorVoz(frase, fraseCruda);
    }
}

function extraerTextoDespues(texto, palabrasClave) {
    for (let kw of palabrasClave) {
        let idx = texto.toLowerCase().indexOf(kw.toLowerCase());
        if (idx !== -1) {
            return texto.substring(idx + kw.length).trim();
        }
    }
    return texto;
}

function navegarPestanaExamenPorVoz(fraseNormalizada, fraseCruda) {
    const mapaTabs = {
        'hematologia': 'hematologia-tab',
        'quimica': 'qs-tab',
        'sanguinea': 'qs-tab',
        'hepatica': 'hepaticas-tab',
        'higado': 'hepaticas-tab',
        'electrolitos': 'electrolitos-tab',
        'endocrinologia': 'endocrinologia-tab',
        'inmunologicos': 'inmunologicos-tab',
        'coagulacion': 'coagulacion-tab',
        'oncologicos': 'oncologicos-tab',
        'reumatologico': 'reumatologico-tab',
        'reuma': 'reumatologico-tab',
        'otros': 'otros-tab',
        'bhcg': 'otros-tab',
        'gyf': 'otros-tab',
        'vitaminas': 'vitaminas-tab',
        'orina': 'orina-tab',
        'heces': 'heces-tab',
        'cultivos': 'cultivos-tab',
        'secreciones': 'secreciones-tab',
        'covid': 'covid-tab',
        'comentario': 'comentario-tab'
    };

    let tabEncontradoId = null;

    for (let [clave, id] of Object.entries(mapaTabs)) {
        if (fraseNormalizada.includes(clave)) {
            tabEncontradoId = id;
            break;
        }
    }

    if (!tabEncontradoId) {
        const botonesTabs = document.querySelectorAll('#mainTabs .nav-link');
        botonesTabs.forEach(btn => {
            let textoBtnNorm = normalizarTexto(btn.textContent);
            if (textoBtnNorm.includes(fraseNormalizada) || fraseNormalizada.includes(textoBtnNorm)) {
                tabEncontradoId = btn.id;
            }
        });
    }

    if (tabEncontradoId) {
        const elTab = document.getElementById(tabEncontradoId);
        if (elTab) {
            let bsTab = new bootstrap.Tab(elTab);
            bsTab.show();
            elTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
            hablarTextoYEscuchar(`Navegando a ${elTab.textContent}`);
        }
    } else {
        hablarTextoYEscuchar("No se encontró el examen solicitado.");
    }
}