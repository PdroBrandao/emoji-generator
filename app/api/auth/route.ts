import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select()
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Erro ao verificar perfil:', fetchError);
    return NextResponse.json({ error: 'Erro ao verificar perfil' }, { status: 500 });
  }

  if (!existingProfile) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ user_id: userId });

    if (insertError) {
      console.error('Erro ao criar perfil:', insertError);
      return NextResponse.json({ error: 'Erro ao criar perfil' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
