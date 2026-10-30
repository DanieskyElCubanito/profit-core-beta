import crypto from 'crypto';
import { getUserById, registerUser } from '../../services/userService.js';

// ==========================================
// 1. MOTOR DE VALIDACIÓN CRIPTOGRÁFICA
// ==========================================
function validateTelegramSignature(initData) {
  if (!initData) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  urlParams.sort();

  let dataCheckString = '';
  for (const [key, value] of urlParams.entries()) {
    dataCheckString += `${key}=${value}\n`;
  }
  dataCheckString = dataCheckString.slice(0, -1);

  const secretKey = crypto.createHmac('sha256', 'WebAppData')
                          .update(process.env.TELEGRAM_BOT_TOKEN)
                          .digest();

  const calculatedHash = crypto.createHmac('sha256', secretKey)
                               .update(dataCheckString)
                               .digest('hex');

  return calculatedHash === hash;
}

export default async function handler(req, res) {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { initData, invited_by } = req.body;

  if (!initData) {
    return res.status(400).json({ error: "Acceso denegado: Falta la firma de seguridad de Telegram." });
  }

  try {
    // 2. VERIFICACIÓN DE IDENTIDAD
    if (!validateTelegramSignature(initData)) {
      console.warn("Intento de acceso fraudulento detectado.");
      return res.status(401).json({ error: "Firma inválida. Posible intento de suplantación." });
    }

    // 3. EXTRACCIÓN SEGURA DE DATOS
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');
    const userData = JSON.parse(userStr);
    const user_id = userData.id;

    // 4. LÓGICA DE BASE DE DATOS
    let user = await getUserById(user_id);

    if (!user) {
      user = await registerUser(user_id, invited_by, userData); 
    }

    // 5. CÁLCULO DE GAMIFICACIÓN (Bono Diario)
    // Verificamos si han pasado 24 horas desde su último reclamo
    let canClaimDaily = true;
    if (user.last_daily_claim) {
        const lastClaimDate = new Date(user.last_daily_claim);
        const now = new Date();
        const diffInHours = Math.abs(now - lastClaimDate) / 36e5; // Convertir milisegundos a horas
        
        if (diffInHours < 24) {
            canClaimDaily = false;
        }
    }

    // 6. ENVIAR DATOS FORMATEADOS AL FRONTEND
    return res.status(200).json({
        id: user.id,
        balance: user.balance || 0,             // Saldo principal (totalEarnedUSD)
        invested: user.invested || 0,           // Capital inyectado (totalInvestedUSDT)
        accumulated: user.accumulated || 0,     // Saldo minado sin recolectar
        canClaimDaily: canClaimDaily            // Booleano para apagar/encender el botón de la misión
    });

  } catch (err) {
    console.error("Error crítico en API auth:", err.message);
    return res.status(500).json({ error: "Fallo en la red neuronal del servidor." });
  }
}
