import { Telegraf, Markup } from 'telegraf';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno (asegúrate de tener un archivo .env en la raíz de tu proyecto)
dotenv.config();

// 1. Inicialización de credenciales
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Tu ID de administrador (Extraído de tu configuración previa)
const ADMIN_ID = 8469212694; 

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ Faltan variables de entorno. Revisa tu archivo .env");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// MIDDLEWARE DE SEGURIDAD (Capa de Protección)
// ==========================================
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    // Si el usuario que escribe no eres tú, ignoramos o bloqueamos
    if (userId !== ADMIN_ID) {
        if (ctx.message) {
            return ctx.reply("⛔ Acceso denegado. Servidor administrativo encriptado.");
        }
        return; // Ignora pulsaciones de botones de otros usuarios
    }
    return next();
});

// ==========================================
// COMANDO PRINCIPAL: /admin
// ==========================================
bot.command('admin', async (ctx) => {
    await mostrarMenuPrincipal(ctx);
});

async function mostrarMenuPrincipal(ctx) {
    const menu = "🎛️ *PANEL DE CONTROL - BEX-COÍN*\n\n" +
                 "Selecciona el módulo que deseas reconfigurar:";

    const botones = Markup.inlineKeyboard([
        [Markup.button.callback('📊 Ver Estadísticas Globales', 'stats')],
        [Markup.button.callback('⚙️ Cambiar ROI Diario', 'set_roi')],
        [Markup.button.callback('🔒 Pausar / Activar Retiros', 'toggle_withdrawals')]
    ]);

    // Si viene de un botón (callback_query), editamos el mensaje para que no haga spam
    if (ctx.updateType === 'callback_query') {
        await ctx.editMessageText(menu, { parse_mode: 'Markdown', ...botones });
    } else {
        await ctx.reply(menu, { parse_mode: 'Markdown', ...botones });
    }
}

// ==========================================
// ACCIONES DE BOTONES (CALLBACKS)
// ==========================================

// Acción: Volver al menú
bot.action('admin', async (ctx) => {
    await mostrarMenuPrincipal(ctx);
});

// Acción: Estadísticas
bot.action('stats', async (ctx) => {
    try {
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { data: users } = await supabase.from('users').select('invested');
        
        const totalInvested = users?.reduce((acc, curr) => acc + (curr.invested || 0), 0) || 0;

        const statsText = `📈 *ESTADÍSTICAS DEL SISTEMA*\n\n` +
                          `👤 Total Usuarios: \`${userCount || 0}\`\n` +
                          `💰 Liquidez Total Inyectada: \`${totalInvested.toFixed(2)} USDT\`\n`;

        await ctx.editMessageText(statsText, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Volver al Menú', 'admin')]])
        });
    } catch (error) {
        await ctx.answerCbQuery("Error al cargar estadísticas.");
    }
});

// Acción: Instrucciones para cambiar ROI
bot.action('set_roi', async (ctx) => {
    const { data } = await supabase.from('settings').select('value').eq('key', 'daily_roi').maybeSingle();
    const actual = data ? Number(data.value) * 100 : 5;

    await ctx.editMessageText(
        `⚙️ *CONFIGURACIÓN DE ROI*\n\n` +
        `El ROI actual es: *${actual}%* diario.\n\n` +
        `Para cambiarlo, escribe en el chat el comando \`/roi\` seguido del porcentaje en decimal.\n\n` +
        `Ejemplo para 6%: \`/roi 0.06\``,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Volver al Menú', 'admin')]])
        }
    );
});

// Comando: /roi 0.05
bot.command('roi', async (ctx) => {
    const args = ctx.message.text.split(' ');
    const newRoi = parseFloat(args[1]);

    if (isNaN(newRoi) || newRoi <= 0 || newRoi > 1) {
        return ctx.reply("❌ Formato incorrecto. Usa por ejemplo: `/roi 0.05` para 5%");
    }

    try {
        await supabase.from('settings').upsert({ key: 'daily_roi', value: String(newRoi) });
        ctx.reply(`✅ ROI diario actualizado con éxito a: \`${newRoi * 100}%\``, { parse_mode: 'Markdown' });
    } catch (error) {
        ctx.reply("❌ Error al actualizar la base de datos.");
    }
});

// Acción: Alternar Retiros
bot.action('toggle_withdrawals', async (ctx) => {
    try {
        const { data } = await supabase.from('settings').select('value').eq('key', 'withdrawals_active').maybeSingle();
        const currentState = data?.value === 'true';
        const newState = !currentState;

        await supabase.from('settings').upsert({ key: 'withdrawals_active', value: String(newState) });

        await ctx.answerCbQuery(`Retiros ${newState ? 'activados' : 'pausados'} correctamente.`);
        
        await ctx.editMessageText(
            `🔒 *ESTADO DE RETIROS*\n\nEstado actual: *${newState ? '🟢 ABIERTOS' : '🔴 PAUSADOS'}*`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Volver al Menú', 'admin')]])
            }
        );
    } catch (error) {
        await ctx.answerCbQuery("Error al cambiar el estado.");
    }
});

// ==========================================
// ARRANQUE DEL NÚCLEO
// ==========================================
bot.launch().then(() => {
    console.log("🤖 Panel de Control Telegram iniciado de forma segura.");
});

// Detener suavemente en caso de reinicio del servidor
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
