import { state } from './state.js';
import { UI } from './ui.js';

let ultimoTick = Date.now();

export function iniciarMotor() {
    setInterval(() => {
        const ahora = Date.now();
        const deltaSegundos = (ahora - ultimoTick) / 1000;
        ultimoTick = ahora;

        if (state.lechugaFin > ahora) {
            const prodPorSegundo = state.obtenerProduccionDiaria() / 86400;
            state.zanahorias += prodPorSegundo * deltaSegundos;
        }

        UI.actualizarPantalla(ahora);
    }, 100); // Corre a 10 cuadros por segundo

    setInterval(() => state.guardar(), 5000);
}
