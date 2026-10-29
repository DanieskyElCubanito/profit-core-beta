import crypto from 'crypto';
import { getUserById, registerUser } from '../../services/userService.js';

//  ==========================================
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

  // Utiliza el token de tu Bot configurado en las variables de entorno
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Limitado a POST por seguridad
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // Ahora exigimos el initData completo y encriptado, no solo el user_id suelto
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
    
    // (Opcional) Puedes extraer el username de userData.username para el Leaderboard

    // 4. LÓGICA DE BASE DE DATOS
    let user = await getUserById(user_id);

    // Si no existe, lo registramos. Aquí ya es seguro asignar el invited_by.
    if (!user) {
      // Nota: Sería ideal guardar también el username y nombre de usuario en la DB aquí
      user = await registerUser(user_id, invited_by, userData); 
    }

    return res.status(200).json(user);

  } catch (err) {
    console.error("Error crítico en API auth:", err.message);
    return res.status(500).json({ error: "Fallo en la red neuronal del servidor." });
  }
}
