import crypto from 'crypto';
import { getUserById, claimDailyReward } from '../../services/userService.js';

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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const { action, initData } = req.body;

    if (!validateTelegramSignature(initData)) {
        return res.status(401).json({ error: "Firma inválida." });
    }

    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');
    const userData = JSON.parse(userStr);
    const user_id = userData.id;

    try {
        if (action === 'claim_daily') {
            const user = await getUserById(user_id);
            if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

            // Verificar tiempo de espera (24h)
            if (user.last_daily_claim) {
                const lastClaim = new Date(user.last_daily_claim);
                const now = new Date();
                const diffHours = Math.abs(now - lastClaim) / 36e5;
                if (diffHours < 24) {
                    return res.status(400).json({ error: "Aún no han pasado 24 horas." });
                }
            }

            // Recompensa de 0.15 USDT
            const reward = 0.15; 
            await claimDailyReward(user_id, reward);

            return res.status(200).json({ success: true, reward });
        }

        return res.status(400).json({ error: "Acción desconocida" });
    } catch (err) {
        console.error("Error procesando tarea:", err);
        return res.status(500).json({ error: "Fallo en el servidor" });
    }
}
