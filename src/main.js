import { state } from './state/appState.js';
import { updateDashboard } from './components/Dashboard.js';
import { renderHistory } from './components/HistoryList.js';
import { requestSecureDeposit, verifyAdminStatus } from './services/apiService.js'; 

let paymentTimerInterval = null;
let isGeneratingWallet = false;

// ==========================================
// 1. MOTOR DE MINERÍA PASIVA (Cloud Mining)
// ==========================================
export function startMiningEngine() {
    setInterval(() => {
        if (typeof state.addMiningTick === 'function') {
            state.addMiningTick();
        }

        const displayHash = document.getElementById('mining-hash');
        const speedEl = document.getElementById('mining-speed');
        
        if (displayHash && state.totalInvestedUSDT > 0) {
            // Mostramos cómo crecen las fracciones minadas en tiempo real
            displayHash.innerText = state.accumulatedMining.toFixed(6);
            
            // Calculamos la potencia visual en GH/s
            if (speedEl) {
                const currentGHS = Math.floor(state.totalInvestedUSDT * 1000);
                speedEl.innerHTML = `<i class="fa-solid fa-bolt" style="color: #00f0ff;"></i> ${currentGHS.toLocaleString()} GH/s Activos`;
            }
        }
        state.saveLocal();
    }, 1000);
}

// ==========================================
// 2. RECOLECCIÓN DE MINERÍA Y MISIONES
// ==========================================
export function claimMining() {
    if (state.accumulatedMining <= 0) {
        window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert("No hay recompensas minadas suficientes para recolectar.") : alert("No hay saldo minado.");
        return;
    }

    // Pasamos lo minado al balance principal
    state.totalEarnedUSD += state.accumulatedMining;
    state.accumulatedMining = 0; // Reiniciamos el contador de minería
    state.saveLocal();

    // Actualizamos UI
    const balanceEl = document.getElementById('main-balance-usdt');
    if (balanceEl) balanceEl.innerText = state.totalEarnedUSD.toFixed(4);

    const displayHash = document.getElementById('mining-hash');
    if (displayHash) displayHash.innerText = "0.000000";

    const msg = "⚡ Minería recolectada y enviada a tu bóveda con éxito.";
    window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
}

export async function claimDailyQuest() {
    if (!state.canClaimDaily) return;
    
    const btn = document.getElementById('daily-quest-btn');
    if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando...`;
        btn.style.cursor = "wait";
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simula llamada al servidor
        
        state.canClaimDaily = false; 
        state.totalEarnedUSD += 0.15; // Bono de ejemplo
        state.saveLocal();
        
        const balanceEl = document.getElementById('main-balance-usdt');
        if (balanceEl) balanceEl.innerText = state.totalEarnedUSD.toFixed(4);

        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-clock"></i> Vuelve Mañana`;
            btn.style.background = "#333";
            btn.style.color = "#888";
            btn.style.borderColor = "#333";
            btn.style.cursor = "not-allowed";
        }
        
        window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert("🎁 ¡Bono de 0.15 USDT añadido a tu bóveda!") : alert("Bono reclamado.");
    } catch (error) {
        console.error("Error en bono diario", error);
    }
}

// ==========================================
// 3. PASARELA DE PAGOS Y NAVEGACIÓN
// ==========================================
export async function openPayModal() {
    // ... (Tu código de openPayModal se mantiene exactamente igual)
}

export function closePayModal() {
    // ... (Tu código de closePayModal se mantiene exactamente igual)
}

export function switchTab(tabId) {
    document.querySelectorAll('.view').forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(tabId);
    if (activeSection) activeSection.classList.add('active'); 
}

export function calculateROI() {
    // ... (Tu código de calculateROI se mantiene exactamente igual)
}

// ==========================================
// 4. ARRANQUE DEL SISTEMA
// ==========================================
window.onload = async () => {
    console.log("Iniciando motor de minería pasiva...");

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.setHeaderColor('#05070a'); 
    }

    try {
        const tgData = window.Telegram?.WebApp?.initDataUnsafe;
        const balanceEl = document.getElementById('main-balance-usdt');
        if (balanceEl) balanceEl.innerText = state.totalEarnedUSD.toFixed(4);

        if (tgData?.user) {
            state.userId = tgData.user.id;
            document.getElementById('user-id').innerText = `ID: ${state.userId}`;
            document.getElementById('user-full-name').innerText = `${tgData.user.first_name} ${tgData.user.last_name || ''}`.trim();
        }

        startMiningEngine();

    } catch (error) {
        console.error("[CRÍTICO] Fallo en la matriz de inicio:", error);
    }
};

window.openPayModal = openPayModal;
window.closePayModal = closePayModal;
window.calculateROI = calculateROI;
window.switchTab = switchTab;
window.claimMining = claimMining;
window.claimDailyQuest = claimDailyQuest;
