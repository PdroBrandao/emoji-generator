import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { emojiId, like } = await request.json();

  if (like) {
    // Adicionar curtida
    const { error: insertError } = await supabase
      .from('emoji_likes')
      .insert({ user_id: userId, emoji_id: emojiId });

    if (insertError) {
      console.error('Erro ao adicionar curtida:', insertError);
      return NextResponse.json({ error: 'Erro ao adicionar curtida' }, { status: 500 });
    }
  } else {
    // Remover curtida
    const { error: deleteError } = await supabase
      .from('emoji_likes')
      .delete()
      .match({ user_id: userId, emoji_id: emojiId });

    if (deleteError) {
      console.error('Erro ao remover curtida:', deleteError);
      return NextResponse.json({ error: 'Erro ao remover curtida' }, { status: 500 });
    }
  }

  // Atualizar contagem de curtidas
  const { count } = await supabase
    .from('emoji_likes')
    .select('*', { count: 'exact' })
    .eq('emoji_id', emojiId);

  const { error: updateError } = await supabase
    .from('emojis')
    .update({ likes_count: count })
    .eq('id', emojiId);

  if (updateError) {
    console.error('Erro ao atualizar contagem de curtidas:', updateError);
    return NextResponse.json({ error: 'Erro ao atualizar contagem de curtidas' }, { status: 500 });
  }

  return NextResponse.json({ success: true, likes_count: count });
}
