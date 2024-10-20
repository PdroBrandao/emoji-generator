import { NextRequest, NextResponse } from 'next/server';
import Replicate from "replicate";
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';
import { error } from 'console';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function streamToBase64(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const buffer = Buffer.concat(chunks);
  return buffer.toString('base64');
}

export async function POST(request: NextRequest) {
  const { userId } = await getAuth(request);
  if (!userId) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ message: 'Prompt é obrigatório' }, { status: 400 });
  }

  try {
    const output = await replicate.run(
      "fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e",
      {
        input: {
          prompt: "A TOK emoji of"+prompt,
          apply_watermark: false
        }
      }
    );

    if (Array.isArray(output) && output.every(item => item instanceof ReadableStream)) {
      const base64Images = await Promise.all(output.map(streamToBase64));
      
      console.log(`Número de imagens geradas: ${base64Images.length}`);

      const emojiUrls: string[] = [];

      for (let i = 0; i < base64Images.length; i++) {
        const base64 = base64Images[i];
        const buffer = Buffer.from(base64, 'base64');
        const fileName = `${userId}_${Date.now()}_${i}.png`;

        // Upload para o bucket do Supabase
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('emojis')
          .upload(fileName, buffer, { contentType: 'image/png' });

        if (uploadError) {
          console.error('Erro ao fazer upload do emoji:', uploadError);
          continue;
        }

        // Obter URL pública
        const { data: publicUrlData } = supabase.storage
          .from('emojis')
          .getPublicUrl(fileName);

        // Inserir na tabela emojis
        const { error: insertError } = await supabase
          .from('emojis')
          .insert({
            image_url: publicUrlData.publicUrl,
            prompt: prompt,
            creator_user_id: userId
          });

        if (insertError) {
          console.error('Erro ao inserir emoji na tabela:', insertError);
        }

        // Após inserir na tabela emojis
        console.log(`Emoji ${i + 1} salvo com sucesso. URL: ${publicUrlData.publicUrl}`);
        emojiUrls.push(publicUrlData.publicUrl);
      }

      return NextResponse.json({ success: true, message: 'Emojis gerados e salvos com sucesso', emojis: emojiUrls });
    } else {
      console.error("Formato de saída inesperado:", output);
      return NextResponse.json({ message: 'Formato de saída inesperado da API Replicate' }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Erro ao gerar emojis:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Erro ao gerar emojis', error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ message: 'Erro ao gerar emojis', error: 'Erro desconhecido' }, { status: 500 });
    }
  }
}
