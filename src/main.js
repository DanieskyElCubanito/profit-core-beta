import { state } from './state/appState.js';
import { updateDashboard } from './components/Dashboard.js';
import { renderHistory } from './components/HistoryList.js';
// Cambiamos el servicio de pagos inseguro por uno que se comunique con tu backend
import { requestSecureDeposit, verifyAdminStatus } from './services/apiService.js'; 
import { API_URLS } from './config/constants.js'; 

let paymentTimerInterval = null;
let isGeneratingWallet = false;

// ==========================================
// 1. MOTOR DE MINERÍA (Sincronizado)
// ==========================================
export function startMiningEngine() {
    setInterval(() => {
        if (typeof state.addMiningTick === 'function') {
            state.addMiningTick();
        }

        const displayHash = document.getElementById('mining-hash');
        if (displayHash && (state.totalInvestedUSDT > 0 || state.accumulatedMining > 0)) {
            const hash = parseFloat(state.accumulatedMining) || 0;
            const rate = parseFloat(state.hashRate) || 0;
            // Formato más visual tipo "odómetro" para gamificación
            displayHash.innerText = (hash * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }, 1000);
}

// ==========================================
// 2. PASARELA DE PAGOS (100% Segura vía Backend)
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
        // En lugar de generar la wallet aquí, le pedimos al backend una dirección de depósito
        // usando el initData encriptado de Telegram para verificar la identidad.
        const initData = window.Telegram?.WebApp?.initData || '';
        const depositData = await requestSecureDeposit(amount, initData);

        if (depositData && depositData.address) {
            if (addressDisplay) addressDisplay.innerText = depositData.address;
            if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(depositData.address)}&color=00f0ff&bgcolor=05070a`; // QR estilo Cyberpunk
            
            startPaymentTimer(30);
        } else {
            throw new Error("El servidor rechazó la solicitud de depósito.");
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
// 3. NAVEGACIÓN
// ==========================================
export function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(section => section.style.display = 'none');
    const activeSection = document.getElementById(tabId);
    if (activeSection) activeSection.style.display = 'block'; 

    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    const activeButton = document.querySelector(`.tab-button[onclick*="${tabId}"]`);
    if (activeButton) activeButton.classList.add('active');
}

// ==========================================
// 4. UI HANDLERS (Sin cambios mayores, lógica limpia)
// ==========================================
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
    const calcPower = document.getElementById('calc-power');
    const calcHash = document.getElementById('calc-hash');

    const amount = parseFloat(amountInput?.value) || 0;
    if (amount >= 0.1) {
        if (calcPower) calcPower.innerHTML = `<i class="fa-solid fa-bolt" style="color: #00f0ff;"></i> ${(amount * 1000).toLocaleString()} GH/s`;
        const dailyProfitUSDT = amount * 0.05; 
        const dailyHash = Math.floor(dailyProfitUSDT * 1000); 
        if (calcHash) calcHash.innerHTML = `<i class="fa-solid fa-cube" style="color: #ff1493;"></i> ${dailyHash.toLocaleString()} HASH`;
    }
}

export function claimMining() {
    const msg = "⚡ Recompensas extraídas y enviadas a tu bóveda.";
    window.Telegram?.WebApp ? window.Telegram.WebApp.showAlert(msg) : alert(msg);
}

// ==========================================
// 5. SECUENCIA DE ARRANQUE Y DETECCIÓN DE ADMIN
// ==========================================
window.onload = async () => {
    console.log("Iniciando protocolos del sistema...");

    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        window.Telegram.WebApp.setHeaderColor('#05070a'); 
    }

    try {
        // En lugar de initDataUnsafe, guardamos initData para llamadas seguras al backend
        const tgData = window.Telegram?.WebApp?.initDataUnsafe;
        const secureInitData = window.Telegram?.WebApp?.initData;
        const urlParams = new URLSearchParams(window.location.search);

        if (tgData?.user) {
            state.userId = tgData.user.id;
            document.getElementById('user-id').innerText = `ID: ${state.userId}`;
            document.getElementById('user-full-name').innerText = `${tgData.user.first_name} ${tgData.user.last_name || ''}`.trim();
            if (tgData.user.photo_url) document.getElementById('user-pic').src = tgData.user.photo_url;
            
            // Verificación silenciosa para habilitar tu panel de control en la WebApp si lo deseas
            if (secureInitData) {
                const isAdmin = await verifyAdminStatus(secureInitData);
                if (isAdmin) {
                    state.isAdmin = true;
                    const adminBtn = document.getElementById('admin-panel-btn');
                    if (adminBtn) adminBtn.style.display = 'block'; // Muestra botón oculto en HTML
                }
            }
        } else {
            state.userId = urlParams.get('user_id') || '88888888';
        }

        document.getElementById('invest-amount')?.addEventListener('input', calculateROI);
        if (typeof updateDashboard === 'function') updateDashboard();
        if (typeof renderHistory === 'function') renderHistory();

        startMiningEngine();
        switchTab('dashboard');

    } catch (error) {
        console.error("[CRÍTICO] Fallo en la matriz de inicio:", error);
    }
};

window.openPayModal = openPayModal;
window.closePayModal = closePayModal;
window.copyLink = copyLink;
window.copyAddress = copyAddress;
window.calculateROI = calculateROI;
window.claimMining = claimMining;
window.switchTab = switchTab;
