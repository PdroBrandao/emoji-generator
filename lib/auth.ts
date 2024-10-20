import { supabase } from './supabaseClient'

export async function createOrGetUser(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // Usuário não existe, vamos criar um novo
    const { data: newUser, error: createError } = await supabase
      .from('profiles')
      .insert([
        { user_id: userId, credits: 3, tier: 'free' }
      ])
      .single()

    if (createError) {
      console.error('Erro ao criar novo usuário:', createError)
      throw createError
    }

    return newUser
  } else if (error) {
    console.error('Erro ao buscar usuário:', error)
    throw error
  }

  return data
}
