export const state = {
    userId: null,
    totalEarnedUSD: parseFloat(localStorage.getItem('balance')) || 0.00,
    totalInvestedUSDT: parseFloat(localStorage.getItem('miningPower')) || 0.0,
    referralCount: 0,
    accumulatedMining: parseFloat(localStorage.getItem('accumulatedMining')) || 0.0000,
    hashRate: 1000,
    canClaimDaily: true, // Para la misión del Dashboard

    // Red de referidos
    refsL1: 0, refsL2: 0, refsL3: 0, refsL4: 0, refsL5: 0,

    saveLocal() {
        localStorage.setItem('balance', this.totalEarnedUSD.toFixed(4));
        localStorage.setItem('miningPower', this.totalInvestedUSDT.toFixed(1));
        localStorage.setItem('accumulatedMining', this.accumulatedMining.toFixed(6));
    },

    addMiningTick() {
        // Minería Pasiva Automatizada (Solo funciona si hay inversión)
        if (this.totalInvestedUSDT > 0) {
            // Ejemplo: 3% diario dividido en los segundos del día
            const gainPerSec = (this.totalInvestedUSDT * 0.03) / 86400;
            this.accumulatedMining += gainPerSec;
        }
    }
};
