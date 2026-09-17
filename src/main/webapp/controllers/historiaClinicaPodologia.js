
async function buscarPacienteParaTurno(cedula) {
    if (!cedula || cedula.length < 5) return;

    try {
        const response = await fetch(`./ControladorPacientes?accion=buscar&cedula=${encodeURIComponent(cedula)}`);
        if (response.ok) {
            const paciente = await response.json();
            if (paciente) {
                if (document.getElementById('turnNombres')) document.getElementById('turnNombres').value = paciente.nombres || '';
                if (document.getElementById('turnCelular')) document.getElementById('turnCelular').value = paciente.telefono || paciente.celular || '';
                if (document.getElementById('turnEmail')) document.getElementById('turnEmail').value = paciente.correo || paciente.email || '';
            }
        }
    } catch (error) {
        console.error("Error al buscar paciente:", error);
    }
}
