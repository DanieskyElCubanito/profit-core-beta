import crypto from 'crypto';
import { getUserById, updateUserBalance, claimMiningReward } from '../../services/userService.js';

// ==========================================
// VALIDACIÓN DE SEGURIDAD TELEGRAM
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
  if (req.method !== 'POST') return res.status(405).json({ status: "error", message: "Método no permitido" });

  // Recibimos initData en lugar de confiar en un user_id suelto
  const { initData, action, amount, amount_to_add } = req.body;

  if (!initData) {
    return res.status(401).json({ status: "error", message: "Acceso no autorizado: Falta credencial de Telegram" });
  }

  try {
    // 1. Verificamos la firma criptográfica
    if (!validateTelegramSignature(initData)) {
      return res.status(401).json({ status: "error", message: "Firma de seguridad inválida." });
    }

    // 2. Extraemos el user_id real de forma segura desde los datos validados
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');
    const userData = JSON.parse(userStr);
    const user_id = userData.id;

    // 3. Buscamos al usuario en la base de datos
    const user = await getUserById(user_id);
    if (!user) {
      return res.status(404).json({ status: "error", message: "Usuario no encontrado en la matriz" });
    }

    // ACCIÓN A: PROCESAR INVERSIÓN
    if (action === 'invest') {
      const parsedAmount = parseFloat(amount);
      if (!parsedAmount || parsedAmount < 0.1) {
        return res.status(400).json({ status: "error", message: "Monto de inversión inválido" });
      }

      if (user.balance < parsedAmount) {
        return res.status(400).json({ status: "error", message: "Saldo insuficiente en la bóveda" });
      }

      const nuevoBalance = user.balance - parsedAmount;
      const nuevaInversion = (user.invested || 0) + parsedAmount;

      await updateUserBalance(user_id, nuevoBalance, nuevaInversion);

      return res.status(200).json({ 
        status: "success", 
        balance: nuevoBalance, 
        invested: nuevaInversion 
      });
    }

    // ACCIÓN B: RECLAMAR MINERÍA
    if (action === 'claim_mining') {
      const currentBalance = parseFloat(user.balance || 0);
      const reward = parseFloat(amount_to_add || 0);
      
      if (reward <= 0) {
        return res.status(400).json({ status: "error", message: "No hay recompensas válidas para reclamar" });
      }

      const newBalance = currentBalance + reward;

      await claimMiningReward(user_id, newBalance);

      return res.status(200).json({
          status: "success",
          new_balance: newBalance
      });
    }

    return res.status(400).json({ status: "error", message: "Acción no reconocida por el núcleo" });

  } catch (error) {
    console.error("Error crítico en invest.js:", error.message);
    return res.status(500).json({ status: "error", message: "Fallo interno en el servidor" });
  }
}
