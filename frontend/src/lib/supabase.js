/**
 * ============================================================================
 * KAELARA A.I — CLIENTE SUPABASE (TELEMETRIA E LOGS OPCIONAIS)
 * ============================================================================
 * Fornece uma instância segura e defensiva do cliente Supabase para registro de
 * mensagens da sessão e histórico de conversas no PostgreSQL em nuvem.
 * 
 * Se as variáveis de ambiente não estiverem configuradas, o cliente permanece nulo
 * e as rotas operam normalmente com fallback no backend local / Render.
 * 
 * @module frontend/src/lib/supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Cliente Supabase condicional exportado como singleton.
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
