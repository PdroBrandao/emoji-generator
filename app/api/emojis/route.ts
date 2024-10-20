import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('emojis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ emojis: data });
  } catch (error) {
    console.error('Erro ao buscar emojis:', error);
    return NextResponse.json({ error: 'Falha ao buscar emojis' }, { status: 500 });
  }
}
