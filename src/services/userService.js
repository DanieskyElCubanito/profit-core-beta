import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usamos el Role Key en el backend para tener permisos de escritura

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function getUserById(userId) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
}

export async function registerUser(userId, invitedBy = null, userData = {}) {
    const newUser = {
        id: userId,
        balance: 0,
        invested: 0,
        accumulated: 0,
        invited_by: invitedBy,
        username: userData.username || null,
        first_name: userData.first_name || null,
        last_daily_claim: null
    };

    const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}

export async function claimDailyReward(userId, rewardAmount) {
    // Para evitar problemas de concurrencia, usamos el método rpc si tienes una función SQL, 
    // o leemos el balance actual y lo sumamos.
    const user = await getUserById(userId);
    const newBalance = (user.balance || 0) + rewardAmount;
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from('users')
        .update({ 
            balance: newBalance,
            last_daily_claim: now 
        })
        .eq('id', userId)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}
