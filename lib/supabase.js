'use client';
import { createClient } from '@supabase/supabase-js';
export var OperationType;
(function (OperationType) {
    OperationType["CREATE"] = "create";
    OperationType["UPDATE"] = "update";
    OperationType["DELETE"] = "delete";
    OperationType["LIST"] = "list";
    OperationType["GET"] = "get";
    OperationType["WRITE"] = "write";
})(OperationType || (OperationType = {}));
let supabaseClient = null;
export function getSupabaseClient() {
    if (supabaseClient) {
        return supabaseClient;
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    });
    return supabaseClient;
}
export function handleSupabaseError(error, operationType, path) {
    const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
            ? error.message
            : typeof error === 'object' && error !== null && 'error' in error && typeof error.error === 'string'
                ? error.error
                : String(error);
    const normalizedMessage = message.toLowerCase();
    const friendlyMessage = normalizedMessage.includes('products_pn_key') || normalizedMessage.includes('duplicate key value')
        ? 'Ja existe um item cadastrado com esse PN. Use outro PN ou edite o item existente.'
        : message;
    const errInfo = {
        error: friendlyMessage,
        operationType,
        path,
    };
    console.warn('Supabase Warning:', JSON.stringify(errInfo));
    throw new Error(friendlyMessage);
}
export async function removeChannel(channel) {
    const supabase = getSupabaseClient();
    await supabase.removeChannel(channel);
}
