import { state } from './state.js';
import { UI } from './ui.js';
import { iniciarMotor } from './engine.js';

window.gameAPI = {
    venderZanahorias() {
        if (state.zanahorias >= 1000) {
            const gananciaUSD = (state.zanahorias / 1000) * 0.01;
            state.saldo += gananciaUSD;
            state.zanahorias = 0;
            state.guardar();
            
            UI.mostrarMensaje(`Liquidación exitosa: +$${gananciaUSD.toFixed(4)} USD`, 'success');
            UI.actualizarPantalla(Date.now());
        } else {
            UI.mostrarMensaje("Liquidez insuficiente. Mínimo de venta: 1,000 zanahorias.", 'error');
        }
    },

    comprarConejo(nivel, precioUSD) {
        if (state.saldo >= precioUSD) {
            state.saldo -= precioUSD;
            state.conejos[nivel]++;
            state.guardar();
            
            UI.mostrarMensaje(`Contrato de producción adquirido correctamente.`, 'success');
            UI.actualizarPantalla(Date.now());
        } else {
            UI.mostrarMensaje("Balance insuficiente para ejecutar esta operación.", 'error');
        }
    },

    comprarLechuga(precioUSD, diasExtra) {
        if (state.saldo >= precioUSD) {
            state.saldo -= precioUSD;
            const ahora = Date.now();
            const milisegundosExtra = diasExtra * 86400 * 1000;
            
            state.lechugaFin = (state.lechugaFin > ahora ? state.lechugaFin : ahora) + milisegundosExtra;
            state.guardar();
            
            UI.mostrarMensaje(`Suministro extendido por ${diasExtra} días.`, 'success');
            UI.actualizarPantalla(Date.now());
        } else {
            UI.mostrarMensaje("Balance insuficiente para extender el suministro.", 'error');
        }
    },

    switchShopTab(tipo) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const tiendaElement = document.getElementById('tienda');
        if(tiendaElement) tiendaElement.classList.add('active');
        
        // Simular click en la pestaña correcta dentro de la tienda
        const btn = document.getElementById(`btn-${tipo}`);
        if(btn && typeof toggleShop === 'function') {
            btn.click();
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    iniciarMotor();
});
