import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// --- DIAGNÓSTICO DE DEPLOY ---
// Se isso aparecer no console do navegador, o problema é na Vercel
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('🚨 ERRO CRÍTICO: Variáveis de ambiente não encontradas!')
    console.log('Tentando ler URL:', supabaseUrl)
    console.log('Tentando ler KEY:', supabaseAnonKey ? 'DEFINIDA (Escondida)' : 'INDEFINIDA')
    
    throw new Error('As credenciais do Supabase não foram carregadas. Verifique as variáveis de ambiente na Vercel.')
}
// -----------------------------

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)