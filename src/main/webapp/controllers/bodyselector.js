document.addEventListener("DOMContentLoaded", () => {
    const bodyPartsTranslation = {
        "right_foot": "Pie derecho", "left_foot": "Pie izquierdo",
        "right_shin": "Espinilla derecha", "left_shin": "Espinilla izquierda",
        "right_ankle": "Tobillo derecho", "left_ankle": "Tobillo izquierdo",
        "buttocks": "Glúteos", "right_thigh": "Muslo derecho",
        "left_thigh": "Muslo izquierdo", "right_knee": "Rodilla derecha",
        "left_knee": "Rodilla izquierda", "torso": "Torso",
        "chest": "Pecho", "upper_back": "Espalda alta",
        "lower_back": "Espalda baja", "right_hip": "Cadera derecha",
        "left_hip": "Cadera izquierda", "pelvis": "Pelvis",
        "left_hand": "Mano izquierda", "right_hand": "Mano derecha",
        "left_wrist": "Muñeca izquierda", "right_wrist": "Muñeca derecha",
        "left_lower_arm": "Antebrazo izquierdo", "right_lower_arm": "Antebrazo derecho",
        "left_elbow": "Codo izquierdo", "left_shoulder": "Hombro izquierdo",
        "left_upper_arm": "Brazo izquierdo superior", "right_upper_arm": "Brazo derecho superior",
        "right_shoulder": "Hombro derecho", "left_shoulder_0": "Omóplato / Hombro izq",
        "neck": "Cuello", "head": "Cabeza"
    };

    const paths = document.querySelectorAll('#bodySVG .fil1');
    const inputDolor = document.getElementById('hcPuntoDolor'); // Campo único de texto
    const resetBtn = document.getElementById('resetBtn');

    let selectedParts = [];

    if (paths.length > 0) {
        paths.forEach(path => {
            path.addEventListener('click', () => {
                const partId = path.id;
                
                if (path.classList.contains('selected')) {
                    path.classList.remove('selected');
                    selectedParts = selectedParts.filter(item => item !== partId);
                } else {
                    // Límite ampliado hasta 10 partes sin mostrar alertas
                    if (selectedParts.length >= 10) {
                        return; 
                    }
                    path.classList.add('selected');
                    selectedParts.push(partId);
                }
                updateInput();
            });
        });
    }

    function updateInput() {
        if (inputDolor) {
            // Mapea los IDs a español y los une con una coma y espacio
            const translatedNames = selectedParts.map(id => bodyPartsTranslation[id] || id);
            inputDolor.value = translatedNames.join(', ');
        }
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            paths.forEach(path => path.classList.remove('selected'));
            selectedParts = [];
            updateInput();
        });
    }
});
