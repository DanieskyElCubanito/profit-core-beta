import { API_URLS } from '../config/constants.js';

// 1. Sincronización Inicial (Reemplaza la lectura insegura de localStorage)
export async function syncUserData(initData) {
    try {
        const response = await fetch(API_URLS.AUTH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData })
        });
        
        if (!response.ok) throw new Error('Error al sincronizar con el servidor.');
        return await response.json(); 
        // Retornará: { balance: 0, invested: 10, accumulated: 0.5 }
    } catch (error) {
        console.error("Error de conexión:", error);
        return null;
    }
}

// 2. Generador de Billeteras Seguras (Se conecta con invest.js)
export async function requestSecureDeposit(amount, initData) {
    try {
        const response = await fetch(API_URLS.DEPOSIT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, initData })
        });
        
        if (!response.ok) throw new Error('El nodo rechazó la solicitud.');
        return await response.json();
    } catch (error) {
        console.error("Error en pasarela de depósito:", error);
        return null;
    }
}

// 3. Validación Rápida de Administrador (Para el botón oculto)
export async function verifyAdminStatus(initData) {
    try {
        // Desencriptamos temporalmente el ID para mostrar la UI.
        // La protección real y final siempre la hará el backend.
        const urlParams = new URLSearchParams(initData);
        const userString = urlParams.get('user');
        if (!userString) return false;
        
        const user = JSON.parse(decodeURIComponent(userString));
        // Compara con tu ID de operador maestro
        return user.id === 8968109534; 
    } catch (error) {
        return false;
    }
}

// 4. Reclamo de Misión Diaria Real
export async function processDailyReward(initData) {
    try {
        const response = await fetch(API_URLS.TASKS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'claim_daily', initData })
        });
        
        return await response.json(); // { success: true, reward: 0.15 }
    } catch (error) {
        return { success: false, error: "Error de conexión" };
    }
}
