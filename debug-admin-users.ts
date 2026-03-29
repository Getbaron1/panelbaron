import { supabase } from './src/lib/supabase'

async function debugAdminUsers() {
  console.log('🔍 Buscando TODOS os usuários em admin_users...')
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, email, nome, role, ativo, senha_hash')
    .order('email')
  
  if (error) {
    console.error('❌ Erro ao buscar:', error)
    return
  }
  
  console.log('📊 Total de usuários:', data?.length)
  console.table(data)
  
  // Agora buscar especificamente kaiqueaguiar3@gmail.com
  console.log('\n🔍 Buscando kaiqueaguiar3@gmail.com...')
  const { data: kaique, error: erroKaique } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', 'kaiqueaguiar3@gmail.com')
    .maybeSingle()
  
  console.log('Resultado:', kaique, 'Erro:', erroKaique)
}

debugAdminUsers()
