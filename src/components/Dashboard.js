import { state } from '../state/appState.js';

export function updateDashboard() {
    // Selectores del DOM - Existentes
    const hashEl = document.getElementById('main-balance-hash');
    const usdtEl = document.getElementById('main-balance-usdt');
    const speedEl = document.getElementById('mining-speed');
    const refEl = document.getElementById('ref-count');
    const idEl = document.getElementById('user-id');
    const nameEl = document.getElementById('user-full-name');
    const refInput = document.getElementById('ref-link');

    // Selectores del DOM - Gamificación y Red
    const levels = [
        document.getElementById('ref-L1'),
        document.getElementById('ref-L2'),
        document.getElementById('ref-L3'),
        document.getElementById('ref-L4'),
        document.getElementById('ref-L5')
    ];
    const rankProgressBar = document.getElementById('rank-progress-fill');
    const rankText = document.getElementById('rank-text');
    const questBtn = document.getElementById('daily-quest-btn');

    // 1. Balance de HASH (Animación de neón si hay ganancias para reclamar)
    if (hashEl) {
        const hashRate = parseFloat(state.hashRate) || 0;
        const totalEarned = parseFloat(state.totalEarnedUSD) || 0;
        const totalHash = Math.floor(totalEarned * hashRate);
        
        hashEl.innerText = totalHash.toLocaleString();
        
        // Efecto visual: Si tiene más de 100 HASH listos, brilla en rosa neón
        if (totalHash > 100) {
            hashEl.style.textShadow = "0 0 10px #ff1493";
            hashEl.style.color = "#ff1493";
        } else {
            hashEl.style.textShadow = "0 0 10px #00f0ff";
            hashEl.style.color = "#00f0ff";
        }
    }

    // 2. Equivalencia en USDT (4 decimales)
    if (usdtEl) {
        const totalEarned = parseFloat(state.totalEarnedUSD) || 0;
        usdtEl.innerText = totalEarned.toFixed(4);
    }

    // 3. Sistema de Gamificación: Rangos y Barra de Progreso
    const invested = parseFloat(state.totalInvestedUSDT) || 0;
    
    let rankName = "⚡ Minero Nodo I";
    let nextTarget = 10; 
    let progressPercent = 0;
    let neonColor = "#00f0ff"; // Cian por defecto

    if (invested >= 50) {
        rankName = "💎 Minero Cuántico (Ballena)";
        nextTarget = invested; // Nivel máximo alcanzado
        progressPercent = 100;
        neonColor = "#ff1493"; // Rosa Neón
    } else if (invested >= 10) {
        rankName = "🚀 Operador de Élite";
        nextTarget = 50;
        progressPercent = (invested / nextTarget) * 100;
        neonColor = "#10b981"; // Esmeralda / Verde Matrix
    } else {
        progressPercent = (invested / nextTarget) * 100;
    }

    // Actualizamos la UI del rango
    if (rankProgressBar) {
        rankProgressBar.style.width = `${Math.min(progressPercent, 100)}%`;
        rankProgressBar.style.backgroundColor = neonColor;
        rankProgressBar.style.boxShadow = `0 0 10px ${neonColor}`;
    }
    if (rankText) {
        rankText.innerText = rankName;
        rankText.style.color = neonColor;
    }

    // 4. Misiones Diarias (Daily Check-in)
    if (questBtn) {
        // state.canClaimDaily debe ser definido por tu backend/estado al iniciar
        if (state.canClaimDaily) {
            questBtn.innerHTML = `<i class="fa-solid fa-gift"></i> Reclamar Bono Diario`;
            questBtn.style.background = "linear-gradient(90deg, #ff1493, #00f0ff)";
            questBtn.style.opacity = "1";
            questBtn.style.cursor = "pointer";
            questBtn.onclick = () => window.claimDailyQuest(); // Conectar a tu función de reclamo
        } else {
            questBtn.innerHTML = `<i class="fa-solid fa-clock"></i> Sincronizando (Vuelve Mañana)`;
            questBtn.style.background = "#333";
            questBtn.style.opacity = "0.5";
            questBtn.style.cursor = "not-allowed";
            questBtn.onclick = null;
        }
    }

    // 5. Contador Total y Red Multinivel
    if (refEl) refEl.innerText = (state.referralCount || 0).toLocaleString();

    const refData = [
        state.refsL1 || 0, state.refsL2 || 0, state.refsL3 || 0, 
        state.refsL4 || 0, state.refsL5 || 0
    ];
    levels.forEach((el, index) => {
        if (el) el.innerText = refData[index].toLocaleString();
    });

    // 6. Credenciales de Seguridad y Nombre Alfa
    if (idEl) idEl.innerText = state.userId ? `ID: ${state.userId}` : 'ID: SYNC_PENDING...';

    if (nameEl) {
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (tgUser?.first_name) {
            nameEl.innerText = `${tgUser.first_name} ${tgUser.last_name || ''}`.trim().toUpperCase();
        } else if (state.userId) {
            nameEl.innerText = `OPERADOR_ALFA_${state.userId.toString().slice(-4)}`;
        } else {
            nameEl.innerText = 'CONECTANDO NODO...';
        }
    }

    // 7. Enlace de Red Cuántica
    if (refInput) {
        refInput.value = state.userId 
            ? `https://t.me/TuBotOficial?startapp=${state.userId}` 
            : 'GENERANDO ENLACE ENCRIPTADO...';
    }

    // 8. Velocidad del Procesador
    if (speedEl) {
        const currentGHS = Math.floor(invested * 1000);
        speedEl.innerHTML = `<i class="fa-solid fa-microchip"></i> ${currentGHS.toLocaleString()} GH/s asignados al Núcleo`;
    }
}
