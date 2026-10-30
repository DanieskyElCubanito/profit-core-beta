// ==========================================
// 1. ESTADO DEL JUEGO Y PERSISTENCIA
// ==========================================
const state = {
    saldo: parseFloat(localStorage.getItem('cf_saldo')) || 0.00,
    zanahorias: parseFloat(localStorage.getItem('cf_zanahorias')) || 0,
    lechugaFin: parseInt(localStorage.getItem('cf_lechuga_fin')) || 0, // Timestamp de cuándo se acaba la comida
    
    // Inventario de conejos (Cantidad comprada de cada uno)
    conejos: JSON.parse(localStorage.getItem('cf_conejos')) || {
        blanco: 0,
        manchado: 0,
        marron: 0,
        rey: 0
    },

    // Tasas de producción (Zanahorias por día)
    tasas: {
        blanco: 1000,
        manchado: 8000,
        marron: 1040000,
        rey: 30000000
    },

    guardar() {
        localStorage.setItem('cf_saldo', this.saldo.toFixed(4));
        localStorage.setItem('cf_zanahorias', this.zanahorias.toFixed(2));
        localStorage.setItem('cf_lechuga_fin', this.lechugaFin.toString());
        localStorage.setItem('cf_conejos', JSON.stringify(this.conejos));
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

    // 1. Verificar si hay lechuga (comida)
    const tieneLechuga = state.lechugaFin > ahora;

    if (tieneLechuga) {
        // 2. Calcular producción total por segundo
        let produccionDiariaTotal = 
            (state.conejos.blanco * state.tasas.blanco) +
            (state.conejos.manchado * state.tasas.manchado) +
            (state.conejos.marron * state.tasas.marron) +
            (state.conejos.rey * state.tasas.rey);

        const produccionPorSegundo = produccionDiariaTotal / 86400; // 86400 segundos en un día
        
        // 3. Sumar zanahorias
        state.zanahorias += produccionPorSegundo * deltaSegundos;
    }

    // 4. Actualizar la interfaz gráfica
    actualizarDOM(tieneLechuga, ahora);
}

// Ejecutar el motor 10 veces por segundo para animaciones fluidas
setInterval(gameLoop, 100);
setInterval(() => state.guardar(), 5000); // Guardar automático cada 5 segundos

// ==========================================
// 3. LÓGICA DE COMPRA Y VENTA
// ==========================================

// Tasa de cambio: 1,000 zanahorias = $0.01
window.venderZanahorias = function() {
    if (state.zanahorias >= 1000) {
        // Calculamos el valor en USD
        const gananciaUSD = (state.zanahorias / 1000) * 0.01;
        state.saldo += gananciaUSD;
        state.zanahorias = 0; // Se vacía la cesta
        state.guardar();
        
        mostrarNotificacion(`¡Vendiste tus zanahorias por $${gananciaUSD.toFixed(2)}!`);
        actualizarDOM(state.lechugaFin > Date.now(), Date.now());
    } else {
        mostrarNotificacion("Necesitas al menos 1,000 zanahorias para vender.");
    }
};

window.comprarConejo = function(tipo, precioUSD) {
    if (state.saldo >= precioUSD) {
        state.saldo -= precioUSD;
        state.conejos[tipo]++;
        state.guardar();
        mostrarNotificacion(`¡Nuevo conejo comprado con éxito!`);
        actualizarDOM(state.lechugaFin > Date.now(), Date.now());
    } else {
        mostrarNotificacion("Saldo insuficiente. ¡Necesitas recargar o vender más zanahorias!");
    }
};

window.comprarLechuga = function(precioUSD, diasExtra) {
    if (state.saldo >= precioUSD) {
        state.saldo -= precioUSD;
        
        const ahora = Date.now();
        const milisegundosExtra = diasExtra * 86400 * 1000;
        
        // Si ya tenía tiempo, se le suma. Si no, se calcula desde ahora.
        if (state.lechugaFin > ahora) {
            state.lechugaFin += milisegundosExtra;
        } else {
            state.lechugaFin = ahora + milisegundosExtra;
        }
        
        state.guardar();
        mostrarNotificacion(`¡Compraste alimento para ${diasExtra} días!`);
        actualizarDOM(true, ahora);
    } else {
        mostrarNotificacion("Saldo insuficiente para comprar lechuga.");
    }
};

// Solo para pruebas: Te regala dinero para que pruebes los botones
window.regalarSaldoPrueba = function() {
    state.saldo += 10.00;
    state.guardar();
    mostrarNotificacion("¡$10.00 añadidos para pruebas!");
};

// ==========================================
// 4. ACTUALIZACIÓN VISUAL (DOM)
// ==========================================
function actualizarDOM(tieneLechuga, ahora) {
    // Actualizar Saldo Global (Hay que ponerle un id="saldo-global" al saldo del header)
    document.querySelectorAll('.balance-pill').forEach(el => {
        el.innerHTML = `$${state.saldo.toFixed(2)} <button class="btn-add" onclick="regalarSaldoPrueba()">+</button>`;
    });

    // Actualizar Cesta en la Granja
    const cestaValor = document.querySelector('.basket-info div div:nth-child(2)');
    const cestaUsd = document.querySelector('.basket-info div div:nth-child(3)');
    if (cestaValor) cestaValor.innerText = Math.floor(state.zanahorias).toLocaleString();
    if (cestaUsd) cestaUsd.innerText = `≈ $${((state.zanahorias / 1000) * 0.01).toFixed(4)}`;

    // Actualizar Botón de Vender
    const btnVender = document.querySelector('.btn-sell span');
    if (btnVender) {
        const usdCalculado = ((state.zanahorias / 1000) * 0.01).toFixed(4);
        btnVender.innerText = `🥕 ${Math.floor(state.zanahorias).toLocaleString()} → +$${usdCalculado}`;
    }

    // Calcular Producción Diaria Actual
    let prodDiaria = 
        (state.conejos.blanco * state.tasas.blanco) +
        (state.conejos.manchado * state.tasas.manchado) +
        (state.conejos.marron * state.tasas.marron) +
        (state.conejos.rey * state.tasas.rey);
    let gananciaDiariaUSD = (prodDiaria / 1000) * 0.01;
    let totalConejos = state.conejos.blanco + state.conejos.manchado + state.conejos.marron + state.conejos.rey;

    // Actualizar Cajas de Estadísticas
    const statsElements = document.querySelectorAll('.stat-box strong');
    if (statsElements.length >= 3) {
        statsElements[0].innerText = `🥕 ${prodDiaria.toLocaleString()}`;
        statsElements[1].innerText = `$${gananciaDiariaUSD.toFixed(2)}`;
        statsElements[2].innerText = totalConejos.toString();
    }

    // Formatear Tiempo de Lechuga (Comedero)
    const comederoTexto = document.querySelector('.card h3 + div + div');
    const comederoCantidad = document.querySelector('.card h3 + div');
    if (comederoTexto && comederoCantidad) {
        if (tieneLechuga) {
            const segundosRestantes = Math.floor((state.lechugaFin - ahora) / 1000);
            const dias = Math.floor(segundosRestantes / 86400);
            const horas = Math.floor((segundosRestantes % 86400) / 3600);
            const minutos = Math.floor((segundosRestantes % 3600) / 60);
            
            comederoTexto.innerText = `Dura ${dias}d ${horas}h ${minutos}m`;
            comederoTexto.style.color = 'var(--text-muted)';
            comederoCantidad.innerText = "LLENO";
            comederoCantidad.style.color = "var(--text-dark)";
        } else {
            comederoTexto.innerText = "¡CONEJOS HAMBRIENTOS!";
            comederoTexto.style.color = "red";
            comederoCantidad.innerText = "VACÍO";
            comederoCantidad.style.color = "red";
        }
    }
}

function mostrarNotificacion(mensaje) {
    // Si estás dentro de Telegram, usa su alerta nativa, si no, usa el alert de navegador
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.showAlert) {
        window.Telegram.WebApp.showAlert(mensaje);
    } else {
        alert(mensaje);
    }
}

// Procesar ganancia offline al iniciar la app
window.onload = function() {
    const ahora = Date.now();
    const tiempoDesconectadoSegundos = (ahora - ultimoTick) / 1000;
    
    // Si tenía comida mientras estuvo fuera
    if (state.lechugaFin > ultimoTick) {
        const segundosEfectivos = Math.min(
            tiempoDesconectadoSegundos, 
            (state.lechugaFin - ultimoTick) / 1000
        );
        
        let produccionDiariaTotal = 
            (state.conejos.blanco * state.tasas.blanco) +
            (state.conejos.manchado * state.tasas.manchado) +
            (state.conejos.marron * state.tasas.marron) +
            (state.conejos.rey * state.tasas.rey);

        const gananciaAusente = (produccionDiariaTotal / 86400) * segundosEfectivos;
        
        if (gananciaAusente > 0) {
            state.zanahorias += gananciaAusente;
            state.guardar();
            setTimeout(() => {
                mostrarNotificacion(`Tus conejos recolectaron ${Math.floor(gananciaAusente).toLocaleString()} zanahorias mientras no estabas. ¡Buen trabajo!`);
            }, 500);
        }
    }
    
    ultimoTick = ahora;
    actualizarDOM(state.lechugaFin > ahora, ahora);
};
