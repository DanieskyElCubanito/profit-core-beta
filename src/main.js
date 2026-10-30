import { state } from './state/appState.js';
import { updateDashboard } from './components/Dashboard.js';
import { renderHistory } from './components/HistoryList.js';

let paymentTimerInterval = null;
let isGeneratingWallet = false;

// ==========================================
// 1. CONEXIÓN AL BACKEND (VERCEL / SUPABASE)
// ==========================================
async function syncUserData(initData) {
    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
        });
        if (response.ok) {
            const data = await response.json();
            // Actualizamos el estado con los datos reales de la base de datos
            state.totalEarnedUSD = data.balance || 0;
            state.totalInvestedUSDT = data.invested || 0;
            state.accumulatedMining = data.accumulated || 0;
            state.canClaimDaily = data.canClaimDaily !== false;
            updateDashboard();
        }
    } catch (error) {
        console.error("Error sincronizando con Supabase:", error);
    }
}

async function verifyAdminStatus(initData) {
    try {
        const urlParams = new URLSearchParams(initData);
        const userString = urlParams.get('user');
        if (!userString) return false;
        const user = JSON.parse(decodeURIComponent(userString));
        return user.id === 8968109534; // Tu ID de operador maestro
    } catch (error) {
        return false;
    }
}

// ==========================================
// 2. MOTOR DE MINERÍA PASIVA (Cloud Mining)
// ==========================================
export function startMiningEngine() {
    setInterval(() => {
        if (typeof state.addMiningTick === 'function') {
            state.addMiningTick();
        }

        const displayHash = document.getElementById('mining-hash');
        const speedEl = document.getElementById('mining-speed');
        
        if (displayHash && state.totalInvestedUSDT > 0) {
            displayHash.innerText = state.accumulatedMining.toFixed(6);
            if (speedEl) {
                const currentGHS = Math.floor(state.totalInvestedUSDT * 1000);
                speedEl.innerHTML = `<i class="fa-solid fa-bolt" style="color: #00f0ff;"></i> ${currentGHS.toLocaleString()} GH/s Activos`;
            }
        }
        state.saveLocal();
    }, 1000);
}

// ==========================================
// 3. RECOLECCIÓN DE MINERÍA Y MISIONES
// ==========================================
export function claimMining() {
    if (state.accumulatedMining <= 0) {
        window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert("No hay recompensas minadas suficientes para recolectar.") : alert("No hay saldo minado.");
        return;
    }

    state.totalEarnedUSD += state.accumulatedMining;
    state.accumulatedMining = 0;
    state.saveLocal();

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
        const initData = window.Telegram?.WebApp?.initData || '';
        // Petición real al backend para validar la misión
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'claim_daily', initData })
        });

        if (!response.ok) throw new Error("Error en servidor");
        
        state.canClaimDaily = false; 
        state.totalEarnedUSD += 0.15; // Recompensa
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
        
        window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert("🎁 ¡Bono añadido a tu bóveda!") : alert("Bono reclamado.");
    } catch (error) {
        console.error("Error en bono diario", error);
        if (btn) {
            btn.innerHTML = `<i class="fa-solid fa-gift"></i> Reclamar Bono Diario`;
            btn.style.cursor = "pointer";
        }
        window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert("❌ Error al reclamar el bono.") : alert("Error al reclamar.");
    }
}

// ==========================================
// 4. PASARELA DE PAGOS SEGURA
// ==========================================
export async function openPayModal() {
    if (isGeneratingWallet) return;

    const amountInput = document.getElementById('invest-amount');
    const amount = parseFloat(amountInput?.value || 0);

    if (!amount || amount < 0.1) {
        const errorMsg = "❌ El mínimo de inyección de liquidez es 0.10 USDT";
        window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert(errorMsg) : alert(errorMsg);
        return;
    }

    isGeneratingWallet = true;
    const payModal = document.getElementById('payModal');
    if (payModal) payModal.style.display = 'flex';

    const addressDisplay = document.getElementById('wallet-address-display');
    if (addressDisplay) addressDisplay.innerText = "Conectando con la blockchain...";
    const qrImg = document.getElementById('qr-image');
    if (qrImg) qrImg.src = ''; 

    try {
        const initData = window.Telegram?.WebApp?.initData || '';
        const response = await fetch('/api/invest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, initData })
        });
        
        if (!response.ok) throw new Error("El nodo rechazó la solicitud.");
        const depositData = await response.json();

        if (depositData && depositData.address) {
            if (addressDisplay) addressDisplay.innerText = depositData.address;
            if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(depositData.address)}&color=00f0ff&bgcolor=05070a`; 
            startPaymentTimer(30);
        }
    } catch (e) {
        console.error("Error de seguridad en pagos:", e);
        if (addressDisplay) addressDisplay.innerText = "Error de red neuronal. Reintentando...";
        setTimeout(() => closePayModal(), 3000);
    } finally {
        isGeneratingWallet = false;
    }
}

export function closePayModal() {
    const payModal = document.getElementById('payModal');
    if (payModal) payModal.style.display = 'none';
    if (paymentTimerInterval) {
        clearInterval(paymentTimerInterval);
        paymentTimerInterval = null;
    }
}

function startPaymentTimer(minutes) {
    if (paymentTimerInterval) clearInterval(paymentTimerInterval);
    let seconds = minutes * 60;

    paymentTimerInterval = setInterval(() => {
        const timerDisplay = document.getElementById('payment-countdown');
        if (seconds <= 0) {
            clearInterval(paymentTimerInterval);
            paymentTimerInterval = null;
            if (timerDisplay) timerDisplay.innerText = "Sesión expirada";
            return;
        }
        let mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        let secs = (seconds % 60).toString().padStart(2, '0');
        if (timerDisplay) timerDisplay.innerText = `${mins}:${secs}`; 
        seconds--;
    }, 1000);
}

// ==========================================
// 5. NAVEGACIÓN Y UI
// ==========================================
export function switchTab(tabId) {
    document.querySelectorAll('.view').forEach(section => section.classList.remove('active'));
    const activeSection = document.getElementById(tabId);
    if (activeSection) activeSection.classList.add('active'); 
}

export function copyLink() {
    const refInput = document.getElementById('ref-link');
    if (refInput && !refInput.value.includes('GENERANDO')) {
        navigator.clipboard.writeText(refInput.value).then(() => {
            window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert("✅ Nodo de referido copiado.") : alert("Copiado.");
        });
    }
}

export function copyAddress() {
    const addrDisplay = document.getElementById('wallet-address-display');
    if (addrDisplay && addrDisplay.innerText.length > 20) {
        navigator.clipboard.writeText(addrDisplay.innerText).then(() => {
            window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert("✅ Hash copiado al portapapeles.") : alert("Copiado.");
        });
    }
}

export function calculateROI() {
    const amountInput = document.getElementById('invest-amount');
    const calcWeekly = document.getElementById('calc-weekly');
    const calcMonthly = document.getElementById('calc-monthly');
    const calcReturn = document.getElementById('calc-return');

    const amount = parseFloat(amountInput?.value) || 0;
    if (amount >= 0.1) {
        const daily = amount * 0.05;
        if (calcWeekly) calcWeekly.innerText = (daily * 7).toFixed(2);
        if (calcMonthly) calcMonthly.innerText = (daily * 30).toFixed(2);
        if (calcReturn) calcReturn.innerText = (amount * 2).toFixed(2);
    }
}

// ==========================================
// 6. ARRANQUE DEL SISTEMA
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
        const secureInitData = window.Telegram?.WebApp?.initData;

        // Actualización UI inicial por defecto
        const balanceEl = document.getElementById('main-balance-usdt');
        if (balanceEl) balanceEl.innerText = state.totalEarnedUSD.toFixed(4);

        if (tgData?.user) {
            state.userId = tgData.user.id;
            document.getElementById('user-id').innerText = `ID: ${state.userId}`;
            document.getElementById('user-full-name').innerText = `${tgData.user.first_name} ${tgData.user.last_name || ''}`.trim();
            
            // Verificamos si es admin
            if (secureInitData) {
                const isAdmin = await verifyAdminStatus(secureInitData);
                if (isAdmin) state.isAdmin = true;
                
                // Pedimos los saldos reales a Supabase en segundo plano
                syncUserData(secureInitData);
            }
        }

        startMiningEngine();

    } catch (error) {
        console.error("[CRÍTICO] Fallo en la matriz de inicio:", error);
    }
};

window.openPayModal = openPayModal;
window.closePayModal = closePayModal;
window.copyLink = copyLink;
window.copyAddress = copyAddress;
window.calculateROI = calculateROI;
window.switchTab = switchTab;
window.claimMining = claimMining;
window.claimDailyQuest = claimDailyQuest;
