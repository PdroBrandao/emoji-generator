import { NextResponse } from 'next/server';
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
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

    console.log("API Response:", output);

    if (Array.isArray(output) && output.every(item => item instanceof ReadableStream)) {
      const base64Images = await Promise.all(output.map(streamToBase64));
      const imageUrls = base64Images.map(base64 => `data:image/png;base64,${base64}`);
      console.log("Processed Image URLs:", imageUrls);
      return NextResponse.json({ emojis: imageUrls });
    } else {
      console.error("Unexpected output format:", output);
      return NextResponse.json({ message: 'Unexpected output format from Replicate API' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating emojis:', error);
    return NextResponse.json({ message: 'Error generating emojis' }, { status: 500 });
  }
}
