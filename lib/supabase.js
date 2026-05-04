import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'meca-auth',
  }
})

export async function getPerfil() {
  return new Promise(async (resolve) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      resolve(data)
      return
    }

    // Si no hay sesión, esperar el evento de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      subscription.unsubscribe()
      if (!session) { resolve(null); return }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      resolve(data)
    })

    // Timeout de 3 segundos
    setTimeout(() => resolve(null), 3000)
  })
}