import { state } from './state.js';

export const UI = {
    actualizarPantalla(ahora) {
        const tieneLechuga = state.lechugaFin > ahora;

        // Actualizar Cesta
        const usdCalculado = ((state.zanahorias / 1000) * 0.01).toFixed(4);
        document.getElementById('cesta-cantidad').innerText = Math.floor(state.zanahorias).toLocaleString();
        document.getElementById('cesta-usd').innerText = `≈ $${usdCalculado}`;
        
        // Botón Vender
        document.getElementById('btn-vender-text').innerText = `🥕 ${Math.floor(state.zanahorias).toLocaleString()} → +$${usdCalculado}`;

        // Stats
        const prodDiaria = state.obtenerProduccionDiaria();
        document.getElementById('stat-prod').innerText = prodDiaria.toLocaleString();
        document.getElementById('stat-ganancia').innerText = `$${((prodDiaria / 1000) * 0.01).toFixed(2)}`;
        document.getElementById('stat-conejos').innerText = state.obtenerTotalConejos();

        // Comedero
        const tiempoEl = document.getElementById('comedero-tiempo');
        const cantidadEl = document.getElementById('comedero-cantidad');
        
        if (tieneLechuga) {
            const seg = Math.floor((state.lechugaFin - ahora) / 1000);
            const d = Math.floor(seg / 86400);
            const h = Math.floor((seg % 86400) / 3600);
            tiempoEl.innerText = `Dura ${d}d ${h}h`;
            tiempoEl.style.color = "var(--text-muted)";
            cantidadEl.innerText = (d * 1000).toLocaleString(); // Cantidad simbólica visual
        } else {
            tiempoEl.innerText = "VACÍO - CONEJOS PAUSADOS";
            tiempoEl.style.color = "red";
            cantidadEl.innerText = "0";
        }
    },

    mostrarMensaje(msg) {
        if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert(msg);
        } else {
            alert(msg);
        }
    }
};
