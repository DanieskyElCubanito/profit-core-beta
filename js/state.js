export const state = {
    saldo: parseFloat(localStorage.getItem('cf_saldo')) || 0.00,
    zanahorias: parseFloat(localStorage.getItem('cf_zanahorias')) || 550.00,
    lechugaFin: parseInt(localStorage.getItem('cf_lechuga_fin')) || Date.now() + (6 * 86400000), // Ejemplo inicial
    
    conejos: JSON.parse(localStorage.getItem('cf_conejos')) || {
        lvl1: 1, lvl2: 0, lvl3: 0, lvl4: 0, lvl5: 0, lvl6: 0, 
        lvl7: 0, lvl8: 0, lvl9: 0, lvl10: 0, lvl11: 0, lvl12: 0
    },

    tasas: {
        lvl1: 1000, lvl2: 8000, lvl3: 21000, lvl4: 44000,
        lvl5: 92000, lvl6: 240000, lvl7: 500000, lvl8: 1040000,
        lvl9: 2700000, lvl10: 5600000, lvl11: 11600000, lvl12: 30000000
    },

    guardar() {
        localStorage.setItem('cf_saldo', this.saldo.toFixed(4));
        localStorage.setItem('cf_zanahorias', this.zanahorias.toFixed(2));
        localStorage.setItem('cf_lechuga_fin', this.lechugaFin.toString());
        localStorage.setItem('cf_conejos', JSON.stringify(this.conejos));
    },

    obtenerProduccionDiaria() {
        let total = 0;
        for (let nivel in this.conejos) {
            total += this.conejos[nivel] * this.tasas[nivel];
        }
        return total;
    },

    obtenerTotalConejos() {
        let total = 0;
        for (let nivel in this.conejos) {
            total += this.conejos[nivel];
        }
        return total;
    }
};
