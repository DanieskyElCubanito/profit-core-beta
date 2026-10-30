// Usamos rutas relativas '/api/' porque tanto el frontend como el backend viven en Vercel
export const API_URLS = {
    AUTH: '/api/auth',       // Sincroniza saldos y valida usuario
    DEPOSIT: '/api/invest',  // Genera direcciones de depósito únicas
    TASKS: '/api/tasks'      // Verifica si ya reclamó el bono diario
};
