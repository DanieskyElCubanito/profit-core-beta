import { state } from '../state/appState.js';

export function renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    // Actualizado al 5% (0.05) para mantener coherencia matemática con el resto de la app
    const dailyReturn = state.totalInvestedUSDT > 0 
        ? (state.totalInvestedUSDT * 0.05).toFixed(4) 
        : "0.0000";

    // Si no hay inversión, mostramos un estado vacío con estilo
    if (state.totalInvestedUSDT === 0) {
        container.innerHTML = `
            <div style="text-align:center; color: #334155; padding: 30px; font-family: monospace;">
                <i class="fa-solid fa-server" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i><br>
                NO HAY REGISTROS EN EL NODO
            </div>
        `;
        return;
    }

    // Historial simulado/real gamificado con colores neon
    const logs = [
        { title: 'Extracción Cuántica', date: 'Hoy, 10:30', amount: dailyReturn, status: 'Aprobado', color: '#10b981' },
        { title: 'Bono de Conexión', date: 'Ayer, 09:15', amount: '0.1500', status: 'Reclamado', color: '#00f0ff' },
        { title: 'Extracción Cuántica', date: 'Ayer, 10:30', amount: dailyReturn, status: 'Aprobado', color: '#10b981' }
    ];

    container.innerHTML = logs.map(log => `
        <div class="history-item" style="background: rgba(0, 0, 0, 0.4); border-left: 4px solid ${log.color}; border-right: 1px solid rgba(255,255,255,0.05); border-top: 1px solid rgba(255,255,255,0.05); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 15px; margin-bottom: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <div class="hist-left">
                <div class="hist-type" style="font-weight: 800; color: #fff; font-size: 0.95rem;">
                    ${log.title}
                </div>
                <div class="hist-date" style="font-size: 0.75rem; color: #64748b; font-family: monospace; margin-top: 4px;">
                    <i class="fa-regular fa-clock"></i> ${log.date}
                </div>
            </div>
            <div class="hist-right" style="text-align: right;">
                <div class="hist-amount" style="color: ${log.color}; font-weight: 900; font-family: monospace; font-size: 1.1rem; text-shadow: 0 0 8px ${log.color}40;">
                    + ${log.amount}
                </div>
                <div class="hist-status" style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">
                    ${log.status}
                </div>
            </div>
        </div>
    `).join('');
}
