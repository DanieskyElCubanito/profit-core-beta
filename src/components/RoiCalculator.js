export function calculateROI() {
    const amountInput = document.getElementById('invest-amount');
    const powerDisplay = document.getElementById('calc-power');
    const hashDisplay = document.getElementById('calc-hash');
    const profitDisplay = document.getElementById('calc-profit-total'); // Opcional para mostrar ganancia estimada
    const rankBadge = document.getElementById('mining-rank-badge');       // Elemento visual para gamificación

    if (!amountInput) return;
    const amount = parseFloat(amountInput.value) || 0;

    // Validación de mínimo operativo
    if (amount < 0.1) {
        if (powerDisplay) powerDisplay.innerText = "0.0 GH/s";
        if (hashDisplay) hashDisplay.innerText = "0 HASH";
        if (profitDisplay) profitDisplay.innerText = "0.00 USDT";
        if (rankBadge) rankBadge.innerText = "Novato";
        return;
    }

    // 1. Potencia y métricas base (5% diario)
    const totalGHs = (amount * 1000).toFixed(1);
    const dailyPercentage = 0.05; 
    const dailyProfitUSDT = amount * dailyPercentage;
    const dailyHash = (dailyProfitUSDT * 1000).toFixed(0);

    // 2. Cálculo proyectado a 30 días (Interés simple o compuesto básico para incentivar)
    const monthlyProfitUSDT = (dailyProfitUSDT * 30).toFixed(2);

    // 3. Sistema de Rangos Gamificados según el monto inyectado
    let userRank = "⚡ Minero Nodo I";
    let rankColor = "#00f0ff"; // Cian neón

    if (amount >= 50) {
        userRank = "💎 Minero Cuántico (Ballena)";
        rankColor = "#ff1493"; // Rosa neón
    } else if (amount >= 10) {
        userRank = "🚀 Operador de Élite";
        rankColor = "#10b981"; // Verde neón / esmeralda
    }

    // Renderizado en la interfaz con validaciones de seguridad
    if (powerDisplay) powerDisplay.innerText = `${Number(totalGHs).toLocaleString()} GH/s`;
    if (hashDisplay) hashDisplay.innerText = `${Number(dailyHash).toLocaleString()} HASH`;
    if (profitDisplay) profitDisplay.innerText = `${monthlyProfitUSDT} USDT / mes`;
    
    if (rankBadge) {
        rankBadge.innerText = userRank;
        rankBadge.style.color = rankColor;
        rankBadge.style.borderColor = rankColor;
    }
}

// Lo exponemos al objeto window para mantener compatibilidad con los inputs HTML (oninput)
window.calculateROI = calculateROI;
