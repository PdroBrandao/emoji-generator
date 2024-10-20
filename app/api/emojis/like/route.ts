import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: NextRequest) {
  const { userId } = await getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { emojiId, like } = await request.json();

  if (!emojiId) {
    return NextResponse.json({ error: 'ID do emoji é obrigatório' }, { status: 400 });
  }

  try {
    // Verificar se o usuário já curtiu este emoji
    const { data: existingLike } = await supabase
      .from('emoji_likes')
      .select()
      .eq('user_id', userId)
      .eq('emoji_id', emojiId)
      .single();

    if (like && !existingLike) {
      // Adicionar curtida
      await supabase.from('emoji_likes').insert({ user_id: userId, emoji_id: emojiId });
    } else if (!like && existingLike) {
      // Remover curtida
      await supabase.from('emoji_likes').delete().eq('user_id', userId).eq('emoji_id', emojiId);
    }

    // Atualizar e obter o novo número de curtidas
    const { data: updatedLikes } = await supabase
      .rpc('update_emoji_likes_count', { emoji_id: emojiId });

    return NextResponse.json({ success: true, likes_count: updatedLikes[0].likes_count });
  } catch (error) {
    console.error('Erro ao processar curtida:', error);
    return NextResponse.json({ error: 'Falha ao processar curtida' }, { status: 500 });
  }
}
