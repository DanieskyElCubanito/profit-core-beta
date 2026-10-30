import { state } from './state.js';
import { UI } from './ui.js';
import { iniciarMotor } from './engine.js';

// Exponemos las funciones al HTML a través de un objeto global
window.gameAPI = {
    venderZanahorias() {
        if (state.zanahorias >= 1000) {
            const gananciaUSD = (state.zanahorias / 1000) * 0.01;
            state.saldo += gananciaUSD;
            state.zanahorias = 0;
            state.guardar();
            UI.mostrarMensaje(`¡Vendiste tus zanahorias por $${gananciaUSD.toFixed(2)}!`);
            UI.actualizarPantalla(Date.now());
        } else {
            UI.mostrarMensaje("Necesitas al menos 1,000 zanahorias para vender.");
        }
    },

    switchShopTab(tipo) {
        // Lógica para cambiar de pestaña en la tienda
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById('tienda').classList.add('active');
        // Aquí puedes agregar la lógica para mostrar conejos o lechuga específicamente
    }
};

// Arrancar el juego al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    iniciarMotor();
});
