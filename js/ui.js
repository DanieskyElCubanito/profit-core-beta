import { state } from './state.js';

// Formateadores profesionales nativos de JavaScript
const formatUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
});

const formatNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
});

export const UI = {
    actualizarPantalla(ahora) {
        const tieneLechuga = state.lechugaFin > ahora;
        const usdCalculado = (state.zanahorias / 1000) * 0.01;

        // Cesta y Botón Vender con precisión financiera
        document.getElementById('cesta-cantidad').innerText = formatNumber.format(state.zanahorias);
        document.getElementById('cesta-usd').innerText = `≈ ${formatUSD.format(usdCalculado)}`;
        document.getElementById('btn-vender-text').innerText = `🥕 ${formatNumber.format(state.zanahorias)} → +${formatUSD.format(usdCalculado)}`;

        // Estadísticas de Rendimiento (Yield)
        const prodDiaria = state.obtenerProduccionDiaria();
        document.getElementById('stat-prod').innerText = formatNumber.format(prodDiaria);
        document.getElementById('stat-ganancia').innerText = formatUSD.format((prodDiaria / 1000) * 0.01);
        document.getElementById('stat-conejos').innerText = formatNumber.format(state.obtenerTotalConejos());

        // Panel de Suministro (Comedero)
        const tiempoEl = document.getElementById('comedero-tiempo');
        const cantidadEl = document.getElementById('comedero-cantidad');
        
        if (tieneLechuga) {
            const seg = Math.floor((state.lechugaFin - ahora) / 1000);
            const d = Math.floor(seg / 86400);
            const h = Math.floor((seg % 86400) / 3600);
            tiempoEl.innerText = `Suministro: ${d}d ${h}h`;
            tiempoEl.style.color = "var(--text-muted)";
            cantidadEl.innerText = formatNumber.format(d * 1000); 
        } else {
            tiempoEl.innerText = "SUMINISTRO AGOTADO - PRODUCCIÓN PAUSADA";
            tiempoEl.style.color = "#ef4444";
            cantidadEl.innerText = "0";
        }
    },

    mostrarMensaje(msg, type = 'success') {
        // Usa la alerta de Telegram si está disponible, si no, usa el Toast Premium
        if (window.Telegram?.WebApp?.showAlert && type === 'error') {
            window.Telegram.WebApp.showAlert(msg);
            return;
        }

        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        
        // Iconos según el tipo de mensaje
        const icon = type === 'success' ? '✅ ' : (type === 'error' ? '❌ ' : 'ℹ️ ');
        toast.innerText = icon + msg;

        container.appendChild(toast);

        // Efecto de salida y destrucción del elemento
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};
