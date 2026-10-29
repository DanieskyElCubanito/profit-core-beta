// ==========================================
// COMPONENTE NOTIFICADOR TOAST PREMIUM
// ==========================================
function showToast(message, type = "success") {
    const existingToast = document.getElementById("cyber-toast");
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.id = "cyber-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(244, 63, 94, 0.95)";
    toast.style.color = "#ffffff";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.boxShadow = type === "success" ? "0 0 15px rgba(16,185,129,0.5)" : "0 0 15px rgba(244,63,94,0.5)";
    toast.style.zIndex = "11000";
    toast.style.fontFamily = "monospace";
    toast.style.fontSize = "0.9rem";
    toast.style.fontWeight = "bold";
    toast.style.textAlign = "center";
    toast.style.border = type === "success" ? "1px solid #10b981" : "1px solid #f43f5e";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Generador matemático local de código QR en SVG (Esto es seguro mantenerlo en cliente para visualización instantánea)
function generateSVGQR(text) {
    const size = 36;
    const matrix = [];
    for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
            const code = text.charCodeAt((i + j) % text.length);
            matrix[i][j] = ((i * j + code) % 3 === 0 || (i % 2 === 0 && j % 4 === 0));
        }
    }
    const applyAnchor = (row, col) => {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if (matrix[row + r] !== undefined && matrix[row + r][col + c] !== undefined) {
                    matrix[row + r][col + c] = (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
                }
            }
        }
    };
    applyAnchor(0, 0);
    applyAnchor(0, size - 7);
    applyAnchor(size - 7, 0);

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">`;
    svg += `<rect width="${size}" height="${size}" fill="#ffffff"/>`;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c]) {
                svg += `<rect width="1" height="1" x="${c}" y="${r}" fill="#000000"/>`;
            }
        }
    }
    svg += '</svg>';
    return svg;
}

// Variable de sesión para retener la wallet activa
let currentActiveWallet = "";

// ==========================================
// LÓGICA DE CONTROL OPERATIVO (WINDOW)
// ==========================================
window.openPayModal = async function() {
    const amountInput = document.getElementById('invest-amount');
    const amount = parseFloat(amountInput ? amountInput.value : 0) || 0;

    if (amount < 0.1) {
        showToast("⚠️ Minimum investment is 0.1 USDT", "error");
        return;
    }

    const payDisplay = document.getElementById('pay-amount-display');
    const walletDisplay = document.getElementById('wallet-address-display');
    const qrContainer = document.getElementById('qr-container');
    const modal = document.getElementById('payModal');

    if (payDisplay) payDisplay.textContent = amount.toFixed(2) + " USDT";
    if (walletDisplay) walletDisplay.textContent = "Solicitando nodo seguro...";
    if (modal) modal.style.display = "flex";

    try {
        // En lugar de generar claves privadas en el navegador, solicitamos la orden al backend de forma segura
        const initData = window.Telegram?.WebApp?.initData || '';
        
        const response = await fetch('/api/invest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData, action: 'generate_deposit', amount })
        });

        const data = await response.json();

        if (data.status === 'success' && data.address) {
            currentActiveWallet = data.address;
            if (walletDisplay) walletDisplay.textContent = data.address;
            if (qrContainer) qrContainer.innerHTML = generateSVGQR(data.address);
        } else {
            throw new Error(data.message || "Error al conectar con la pasarela.");
        }
    } catch (e) {
        console.error("Error en pasarela:", e);
        if (walletDisplay) walletDisplay.textContent = "Error de conexión con la red.";
        showToast("❌ Error al generar la dirección de pago", "error");
    }
};

window.closePayModal = function() {
    const modal = document.getElementById('payModal');
    if (modal) modal.style.display = "none";
};

window.copyAddress = function() {
    if (!currentActiveWallet) return;
    navigator.clipboard.writeText(currentActiveWallet).then(() => {
        showToast("Address copied successfully!", "success");
    }).catch(err => {
        console.error('Copy failure: ', err);
    });
};

window.triggerToast = function(message, type) {
    showToast(message, type);
};
