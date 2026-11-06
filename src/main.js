// ==========================================
// 1. ESTADO DEL JUEGO Y PERSISTENCIA
// ==========================================
const state = {
    saldo: parseFloat(localStorage.getItem('cf_saldo')) || 0.00,
    withdrawable: parseFloat(localStorage.getItem('cf_withdrawable')) || 0.00,
    huevos: parseFloat(localStorage.getItem('cf_huevos')) || 0,
    comederoFin: parseInt(localStorage.getItem('cf_comedero_fin')) || 0, // Timestamp de cuándo se acaba el maíz

    // Inventario de las 8 razas de gallinas
    gallinas: JSON.parse(localStorage.getItem('cf_gallinas')) || {
        lvl1: 0, lvl2: 0, lvl3: 0, lvl4: 0,
        lvl5: 0, lvl6: 0, lvl7: 0, lvl8: 0
    },

    // Tasas de producción (Huevos por día de cada gallina)
    tasas: {
        lvl1: 92000,
        lvl2: 240000,
        lvl3: 500000,
        lvl4: 1040000,
        lvl5: 2700000,
        lvl6: 5600000,
        lvl7: 11600000,
        lvl8: 30000000
    },

    guardar() {
        localStorage.setItem('cf_saldo', this.saldo.toFixed(4));
        localStorage.setItem('cf_withdrawable', this.withdrawable.toFixed(4));
        localStorage.setItem('cf_huevos', this.huevos.toFixed(2));
        localStorage.setItem('cf_comedero_fin', this.comederoFin.toString());
        localStorage.setItem('cf_gallinas', JSON.stringify(this.gallinas));
    }
};

// ==========================================
// 2. MOTOR DE TIEMPO Y PRODUCCIÓN (Game Loop)
// ==========================================
let ultimoTick = Date.now();

function gameLoop() {
    const ahora = Date.now();
    const deltaSegundos = (ahora - ultimoTick) / 1000;
    ultimoTick = ahora;

    const tieneComida = state.comederoFin > ahora;

    if (tieneComida) {
        let produccionDiariaTotal = Object.keys(state.gallinas).reduce((total, key) => {
            return total + (state.gallinas[key] * state.tasas[key]);
        }, 0);

        const produccionPorSegundo = produccionDiariaTotal / 86400;
        state.huevos += produccionPorSegundo * deltaSegundos;
    }

    actualizarDOM(tieneComida, ahora);
}

setInterval(gameLoop, 100);
setInterval(() => state.guardar(), 5000);

// ==========================================
// 3. LÓGICA DE JUEGO (API EXPUESTA A HTML)
// ==========================================
window.gameAPI = {
    venderZanahorias() {
        if (state.huevos >= 1000) {
            const gananciaUSD = (state.huevos / 100000) * 1; // 100,000 huevos = $1.00 (ajustable según tu tasa)
            state.saldo += gananciaUSD;
            state.withdrawable += gananciaUSD;
            state.huevos = 0;
            state.guardar();

            mostrarNotificacion(`¡Vendiste tus huevos por $${gananciaUSD.toFixed(4)}!`);
            actualizarDOM(state.comederoFin > Date.now(), Date.now());
        } else {
            mostrarNotificacion("Necesitas al menos 1,000 huevos para vender.");
        }
    },

    comprarConejo(tipo, precioUSD) {
        if (state.saldo >= precioUSD) {
            state.saldo -= precioUSD;
            if (state.gallinas[tipo] !== undefined) {
                state.gallinas[tipo]++;
            }
            state.guardar();
            mostrarNotificacion(`¡Gallina comprada con éxito!`);
            actualizarDOM(state.comederoFin > Date.now(), Date.now());
        } else {
            mostrarNotificacion("Saldo insuficiente. ¡Recarga o vende más huevos!");
        }
    },

    comprarAlimento(precioUSD, cantidadMaiz) {
        if (state.saldo >= precioUSD) {
            state.saldo -= precioUSD;

            const ahora = Date.now();
            // Supongamos que cada 50,000 de maíz dura 50 días (1 día por cada 1,000 maíz)
            const milisegundosExtra = (cantidadMaiz / 1000) * 86400 * 1000;

            if (state.comederoFin > ahora) {
                state.comederoFin += milisegundosExtra;
            } else {
                state.comederoFin = ahora + milisegundosExtra;
            }

            state.guardar();
            mostrarNotificacion(`¡Compraste ${cantidadMaiz.toLocaleString()} unidades de maíz!`);
            actualizarDOM(true, ahora);
        } else {
            mostrarNotificacion("Saldo insuficiente para comprar maíz.");
        }
    },

    reclamarBono() {
        state.comederoFin = Math.max(state.comederoFin, Date.now()) + (2000 * 86400 * 1000);
        state.guardar();
        mostrarNotificacion("¡Has reclamado tu maíz diario con éxito!");
        actualizarDOM(true, Date.now());
    },

    regalarSaldo() {
        state.saldo += 10.00;
        state.guardar();
        mostrarNotificacion("¡$10.00 añadidos para pruebas!");
        actualizarDOM(state.comederoFin > Date.now(), Date.now());
    }
};

// ==========================================
// 4. ACTUALIZACIÓN VISUAL (DOM)
// ==========================================
function actualizarDOM(tieneComida, ahora) {
    // Saldo en el Header y Vista Wallet
    document.getElementById('user-balance').innerText = `$${state.saldo.toFixed(2)}`;
    const walletBal = document.getElementById('wallet-balance');
    const walletWith = document.getElementById('wallet-withdrawable');
    if (walletBal) walletBal.innerText = `$${state.saldo.toFixed(2)}`;
    if (walletWith) walletWith.innerText = `$${state.withdrawable.toFixed(2)}`;

    // Cesta en la Granja
    const cestaCantidad = document.getElementById('cesta-cantidad');
    const cestaUsd = document.getElementById('cesta-usd');
    const btnVenderText = document.getElementById('btn-vender-text');

    const usdHuevos = (state.huevos / 100000);
    if (cestaCantidad) cestaCantidad.innerText = Math.floor(state.huevos).toLocaleString();
    if (cestaUsd) cestaUsd.innerText = `≈ $${usdHuevos.toFixed(4)}`;
    if (btnVenderText) btnVenderText.innerText = `${Math.floor(state.huevos).toLocaleString()} → +$${usdHuevos.toFixed(4)}`;

    // Calcular Producción Total Diaria y Total de Gallinas
    let prodDiaria = 0;
    let totalGallinas = 0;
    Object.keys(state.gallinas).forEach(key => {
        prodDiaria += state.gallinas[key] * state.tasas[key];
        totalGallinas += state.gallinas[key];
    });

    let gananciaDiariaUSD = (prodDiaria / 100000);

    // Actualizar Estadísticas
    const statProd = document.getElementById('stat-prod');
    const statGanancia = document.getElementById('stat-ganancia');
    const statConejos = document.getElementById('stat-conejos');

    if (statProd) statProd.innerText = prodDiaria.toLocaleString();
    if (statGanancia) statGanancia.innerText = `$${gananciaDiariaUSD.toFixed(2)}`;
    if (statConejos) statConejos.innerText = totalGallinas.toString();

    // Comedero / Maíz
    const comederoCantidad = document.getElementById('comedero-cantidad');
    const comederoTiempo = document.getElementById('comedero-tiempo');
    const comederoTienda = document.getElementById('comedero-tienda');

    const tiempoRestantesSeg = Math.floor((state.comederoFin - ahora) / 1000);
    const maizEstimadoRestante = Math.max(0, Math.floor(tiempoRestantesSeg * (prodDiaria / 86400)));

    if (comederoCantidad) comederoCantidad.innerText = maizEstimadoRestante.toLocaleString();
    if (comederoTienda) comederoTienda.innerText = maizEstimadoRestante.toLocaleString();

    if (comederoTiempo) {
        if (tieneComida && tiempoRestantesSeg > 0) {
            const dias = Math.floor(tiempoRestantesSeg / 86400);
            const horas = Math.floor((tiempoRestantesSeg % 86400) / 3600);
            comederoTiempo.innerText = `Dura ${dias}d ${horas}h`;
            comederoTiempo.style.color = 'var(--text-muted)';
        } else {
            comederoTiempo.innerText = "SUMINISTRO AGOTADO";
            comederoTiempo.style.color = "red";
        }
    }
}

function mostrarNotificacion(mensaje) {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
        window.Telegram.WebApp.showAlert(mensaje);
    } else {
        // Creamos un toast visual bonito en la pantalla si no estamos en Telegram Desktop
        const container = document.getElementById('toast-container');
        if (container) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.innerHTML = `<i class="fa-solid fa-circle-info" style="color:#22c55e;"></i> <span>${mensaje}</span>`;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        } else {
            alert(mensaje);
        }
    }
}

// Procesar ganancia offline al iniciar la app
window.onload = function() {
    const ahora = Date.now();
    const tiempoDesconectadoSegundos = (ahora - ultimoTick) / 1000;

    if (state.comederoFin > ultimoTick) {
        const segundosEfectivos = Math.min(
            tiempoDesconectadoSegundos, 
            (state.comederoFin - ultimoTick) / 1000
        );

        let produccionDiariaTotal = 0;
        Object.keys(state.gallinas).forEach(key => {
            produccionDiariaTotal += state.gallinas[key] * state.tasas[key];
        });

        const gananciaAusente = (produccionDiariaTotal / 86400) * segundosEfectivos;

        if (gananciaAusente > 0) {
            state.huevos += gananciaAusente;
            state.guardar();
            setTimeout(() => {
                mostrarNotificacion(`Tus gallinas pusieron ${Math.floor(gananciaAusente).toLocaleString()} huevos mientras no estabas. ¡Buen trabajo!`);
            }, 500);
        }
    }

    ultimoTick = ahora;
    actualizarDOM(state.comederoFin > ahora, ahora);
};
