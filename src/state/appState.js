export const state = {
    userId: null,
    totalEarnedUSD: parseFloat(localStorage.getItem('balance')) || 0.00,
    totalInvestedUSDT: parseFloat(localStorage.getItem('miningPower')) || 0.0,
    referralCount: 0,
    accumulatedMining: parseFloat(localStorage.getItem('accumulatedMining')) || 0.0000,
    hashRate: 1000,

    // --- NUEVAS VARIABLES DE GAMIFICACIÓN ---
    energy: parseFloat(localStorage.getItem('energy')) || 1000,
    maxEnergy: 1000,
    tapPower: 0.0001, // USDT ganado por cada toque manual
    energyRechargeRate: 3, // Cuánta energía recupera por segundo
    
    // Red de referidos
    refsL1: 0, refsL2: 0, refsL3: 0, refsL4: 0, refsL5: 0,

    saveLocal() {
        localStorage.setItem('balance', this.totalEarnedUSD.toFixed(4));
        localStorage.setItem('miningPower', this.totalInvestedUSDT.toFixed(1));
        localStorage.setItem('accumulatedMining', this.accumulatedMining.toFixed(6));
        localStorage.setItem('energy', this.energy.toString());
    },

    addMiningTick() {
        // 1. Minería Pasiva (Contratos)
        if (this.totalInvestedUSDT > 0) {
            const gainPerSec = (this.totalInvestedUSDT * 0.03) / 86400;
            this.accumulatedMining += gainPerSec;
        }

        // 2. Recarga Automática de Energía (Batería del Tap-to-Earn)
        if (this.energy < this.maxEnergy) {
            this.energy = Math.min(this.maxEnergy, this.energy + this.energyRechargeRate);
            
            // Actualización visual directa en el DOM si estamos en la vista
            const energyFill = document.getElementById('energy-fill');
            const energyText = document.getElementById('energy-text');
            if (energyFill && energyText) {
                const percent = (this.energy / this.maxEnergy) * 100;
                energyFill.style.width = `${percent}%`;
                energyText.innerText = `${Math.floor(this.energy)} / ${this.maxEnergy}`;
            }
        }
    }
};
