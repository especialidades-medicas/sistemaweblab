/**
 * ASISTENTE DE VOZ INTELIGENTE - LABORATORIO CLÍNICO
 * Versión Directa con Relleno Secuencial por Comas (,) y 60 Segundos de Inactividad.
 */

document.addEventListener('DOMContentLoaded', () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    let estadoConversacion = 'IDLE'; // 'IDLE', 'ESPERANDO_RESULTADOS_SECUENCIALES'
    let temporizadorInactividad = null;
    let inputsActivosSeccion = []; // Almacena los inputs de la tabla actual
    let ultimoTextoHablado = ''; 

    // Mapeo directo de comandos cortos a las sub-pestañas reales del HTML
    const mapaAccesoDirecto = {
        'hematologia': { idTab: 'auto-tab', nombre: 'Hematología Automatizada' },
        'biometria': { idTab: 'auto-tab', nombre: 'Hematología Automatizada' },
        'automatizada': { idTab: 'auto-tab', nombre: 'Hematología Automatizada' },
        'pediatrico': { idTab: 'pediatrico-tab', nombre: 'Hematología Pediátrica' },
        'pediatrica': { idTab: 'pediatrico-tab', nombre: 'Hematología Pediátrica' },
        'manual': { idTab: 'manual-tab', nombre: 'Hematología Manual' },
        'ves': { idTab: 'ves-tab', nombre: 'VES' },
        'quimica': { idTab: 'qs-tab', nombre: 'Química Sanguínea' },
        'sanguinea': { idTab: 'qs-tab', nombre: 'Química Sanguínea' },
        'hepatica': { idTab: 'hepaticas-tab', nombre: 'Hepáticas' },
        'electrolitos': { idTab: 'electrolitos-tab', nombre: 'Electrolitos' },
        'endocrinologia': { idTab: 'endocrinologia-tab', nombre: 'Endocrinología' },
        'inmunologicos': { idTab: 'inmunologicos-tab', nombre: 'Inmunológicos' },
        'coagulacion': { idTab: 'coagulacion-tab', nombre: 'Coagulación' },
        'oncologicos': { idTab: 'oncologicos-tab', nombre: 'Oncológicos' },
        'reumatologico': { idTab: 'reumatologico-tab', nombre: 'Reumatológico' },
        'otros': { idTab: 'otros-tab', nombre: 'Otros' },
        'vitaminas': { idTab: 'vitaminas-tab', nombre: 'Vitaminas' },
        'orina': { idTab: 'orina-tab', nombre: 'Orina' },
        'heces': { idTab: 'heces-tab', nombre: 'Heces' },
        'cultivos': { idTab: 'cultivos-tab', nombre: 'Cultivos' },
        'secreciones': { idTab: 'secreciones-tab', nombre: 'Secreciones' },
        'covid': { idTab: 'covid-tab', nombre: 'Covid' },
        'comentario': { idTab: 'comentario-tab', nombre: 'Comentario' }
    };

    const btnVoz = document.getElementById('btnVozGlobal');
    const estadoVoz = document.getElementById('estadoVoz');

    function hablarTexto(texto, callbackCuandoTermine) {
        ultimoTextoHablado = texto;
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

            if (vozFemenina) utterance.voice = vozFemenina;

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

    // Temporizador aumentado a 60 segundos (60000 ms)
    function iniciarTemporizador60Seg() {
        clearTimeout(temporizadorInactividad);
        temporizadorInactividad = setTimeout(() => {
            if (estadoConversacion !== 'IDLE') {
                hablarTexto("Tiempo agotado sin respuesta. Cerrando micrófono.", () => {
                    estadoConversacion = 'IDLE';
                    restaurarBotonVozVisual();
                    if (recognition) {
                        try { recognition.stop(); } catch(e){}
                    }
                });
            }
        }, 60000); 
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

        if (btnVoz) {
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
        }

        recognition.onresult = (event) => {
            clearTimeout(temporizadorInactividad);
            const fraseCruda = event.results[0][0].transcript;
            const frase = normalizarTexto(fraseCruda);
            if (estadoVoz) estadoVoz.textContent = `Escuchado: "${fraseCruda}"`;
            
            procesarFlujoConversacional(frase, fraseCruda);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            restaurarBotonVozVisual();
            if (estadoVoz) estadoVoz.textContent = "Procesado ✔️";
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
            if (btnVoz) {
                btnVoz.classList.remove('btn-primary');
                btnVoz.classList.add('btn-danger');
            }
            iniciarTemporizador60Seg();
        } catch (err) {
            console.log(err);
        }
    }

    function procesarFlujoConversacional(frase, fraseCruda) {
        if (frase.includes('repite') || frase.includes('repetir')) {
            iniciarTemporizador60Seg();
            hablarTexto(ultimoTextoHablado, () => {
                iniciarEscuchaManual();
            });
            return;
        }

        // Si el sistema está esperando los resultados secuenciales separados por comas
        if (estadoConversacion === 'ESPERANDO_RESULTADOS_SECUENCIALES') {
            estadoConversacion = 'IDLE';
            restaurarBotonVozVisual();

            // Limpiar y separar los valores dictados por comas
            let valores = fraseCruda.split(',').map(v => v.trim());
            let ingresados = 0;

            inputsActivosSeccion.forEach((input, index) => {
                if (valores[index] !== undefined) {
                    input.value = valores[index];
                    // Disparar evento change por si el input tiene validaciones
                    input.dispatchEvent(new Event('change'));
                    ingresados++;
                }
            });

            hablarTexto(`Listo. Se ingresaron ${ingresados} resultados correctamente.`);
            return;
        }

        // Detección del comando "ingresar resultado [sección]" de forma directa
        if (frase.includes('ingresa resultado') || frase.includes('ingresar resultado') || frase.includes('ingresar resultados')) {
            let claveEncontrada = null;
            
            // Buscar cuál sub-sección nombró el usuario en la frase
            for (let clave in mapaAccesoDirecto) {
                if (frase.includes(clave)) {
                    claveEncontrada = clave;
                    break;
                }
            }

            if (claveEncontrada) {
                let destino = mapaAccesoDirecto[claveEncontrada];
                let elTab = document.getElementById(destino.idTab);
                
                if (elTab) {
                    let bsTab = new bootstrap.Tab(elTab);
                    bsTab.show();
                    elTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });

                    // Buscar el contenedor activo actual de esa pestaña para extraer sus inputs
                    setTimeout(() => {
                        let paneId = elTab.getAttribute('data-bs-target') || elTab.getAttribute('href');
                        let contenedorPane = document.querySelector(paneId) || document.querySelector('.tab-pane.active');
                        
                        if (contenedorPane) {
                            inputsActivosSeccion = Array.from(contenedorPane.querySelectorAll('input.form-control-editable'));
                        } else {
                            inputsActivosSeccion = Array.from(document.querySelectorAll('.tab-pane.fade.show input.form-control-editable, .tab-pane.active input.form-control-editable'));
                        }

                        estadoConversacion = 'ESPERANDO_RESULTADOS_SECUENCIALES';
                        iniciarTemporizador60Seg();

                        hablarTexto(`Ingresa en orden el resultado mencionando una coma para pasar al siguiente en ${destino.nombre}. Te escucho.`, () => {
                            iniciarEscuchaManual();
                            iniciarTemporizador60Seg();
                        });
                    }, 300);
                }
            } else {
                hablarTexto("Por favor especifica el examen, por ejemplo: ingresa resultado hematología o pediátrico.");
            }
            return;
        }

        // Manejo de Datos del Paciente (Cédula, Orden, Nombres, etc.)
        if (frase.includes('cedula') || frase.includes('documento')) {
            let valor = extraerTextoDespues(fraseCruda, ['cédula', 'cedula', 'documento']);
            if (valor) {
                document.getElementById('codDoc').value = valor;
                document.getElementById('txtCodDocVisual').textContent = valor;
                hablarTexto(`Cédula ingresada: ${valor}`);
            }
        } 
        else if (frase.includes('orden')) {
            let valor = extraerTextoDespues(fraseCruda, ['orden número', 'orden numero', 'orden', 'codigo', 'código']);
            if (valor) {
                let valorNumerico = valor.replace(/\D/g, '');
                document.getElementById('idOrden').value = valorNumerico;
                document.getElementById('txtIdOrdenVisual').textContent = valorNumerico;
                if (typeof buscarOrden === 'function') {
                    buscarOrden(valorNumerico);
                }
                hablarTexto(`Orden número ${valorNumerico}`);
            }
        } 
        else if (frase.includes('nombre')) {
            let valor = extraerTextoDespues(fraseCruda, ['nombres y apellidos', 'nombres', 'nombre']);
            if (valor) {
                let nombreMayus = valor.toUpperCase();
                document.getElementById('nombrePaciente').value = nombreMayus;
                document.getElementById('txtNombreVisual').textContent = nombreMayus;
                hablarTexto(`Nombres: ${nombreMayus}`);
            }
        } 
        else if (frase.includes('edad')) {
            let valor = extraerTextoDespues(fraseCruda, ['edad']);
            if (valor) {
                let numEdad = valor.replace(/\D/g, '');
                document.getElementById('edadPaciente').value = numEdad + ' años';
                document.getElementById('txtEdadVisual').textContent = numEdad + ' años';
                hablarTexto(`Edad: ${numEdad} años`);
            }
        } 
        else if (frase.includes('nacimiento')) {
            let textoFecha = extraerTextoDespues(fraseCruda, ['fecha de nacimiento', 'nacimiento']);
            let fechaFormateada = convertirTextoAFecha(textoFecha);
            
            if (fechaFormateada) {
                document.getElementById('fechaNacimiento').value = fechaFormateada;
                document.getElementById('txtFechaNacVisual').textContent = fechaFormateada;
                hablarTexto(`Fecha de nacimiento registrada`);
            } else {
                hablarTexto(`No pude entender la fecha. Intenta como: nacimiento 15 05 1990`);
            }
        }
        else if (frase.includes('sexo') || frase.includes('genero')) {
            let selectSexo = document.getElementById('sexoPaciente');
            if (frase.includes('femenino')) {
                selectSexo.value = 'Femenino';
                document.getElementById('txtSexoVisual').textContent = 'Femenino';
                hablarTexto("Sexo Femenino seleccionado");
            } else if (frase.includes('masculino')) {
                selectSexo.value = 'Masculino';
                document.getElementById('txtSexoVisual').textContent = 'Masculino';
                hablarTexto("Sexo Masculino seleccionado");
            }
        } 
        else if (frase.includes('telefono')) {
            let valor = extraerTextoDespues(fraseCruda, ['teléfono', 'telefono']);
            if (valor) {
                document.getElementById('telefonoPaciente').value = valor;
                document.getElementById('txtTelVisual').textContent = valor;
                hablarTexto(`Teléfono guardado`);
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
            'oncológicos': 'oncologicos-tab',
            'reumatologico': 'reumatologico-tab',
            'reuma': 'reumatologico-tab',
            'otros': 'otros-tab',
            'bhcg': 'otros-tab',
            'embarazo': 'otros-tab',
            'grupo y factor': 'otros-tab',
            'koh': 'otros-tab',
            'drogas': 'otros-tab',
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
                hablarTexto(`Navegando a ${elTab.textContent}`);
            }
        } else {
            hablarTexto("No se encontró el examen o sección solicitada.");
        }
    }
});
