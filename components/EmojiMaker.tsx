"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type GeneratedEmoji = {
  id: number;
  src: string;
  likes: number;
  prompt: string;
  isLiked: boolean;
};

export default function EmojiMaker() {
  const [prompt, setPrompt] = useState("");
  const [generatedEmojis, setGeneratedEmojis] = useState<GeneratedEmoji[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmoji, setCurrentEmoji] = useState<GeneratedEmoji | null>(null);
  const [allEmojis, setAllEmojis] = useState<GeneratedEmoji[]>([]);

  useEffect(() => {
    fetchAllEmojis();
  }, []);

  const fetchAllEmojis = async () => {
    try {
      const response = await fetch('/api/emojis');
      if (!response.ok) {
        throw new Error('Falha ao buscar emojis');
      }
      const data = await response.json();
      const formattedEmojis = data.emojis.map((emoji: {
        id: number;
        image_url: string;
        likes_count: number;
        prompt: string;
      }) => ({
        id: emoji.id,
        src: emoji.image_url,
        likes: emoji.likes_count,
        prompt: emoji.prompt,
        isLiked: false, // Você pode implementar a lógica de verificação de curtida aqui
      }));
      setAllEmojis(formattedEmojis);
    } catch (error) {
      console.error('Erro ao buscar emojis:', error);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-emoji', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar emojis');
      }

      const data = await response.json();
      console.log("Resposta da API:", data);

      if (data.success && Array.isArray(data.emojis) && data.emojis.length > 0) {
        const newEmoji = { id: Date.now(), src: data.emojis[0], likes: 0, prompt, isLiked: false };
        setCurrentEmoji(newEmoji);
        setGeneratedEmojis(prevEmojis => [newEmoji, ...prevEmojis]);
        setAllEmojis(prevEmojis => [newEmoji, ...prevEmojis]);
      } else {
        console.error("Formato de dados inesperado ou erro na API:", data);
        throw new Error(data.message || 'Falha ao gerar emojis');
      }
    } catch (error) {
      console.error('Erro ao gerar emojis:', error);
      alert('Falha ao gerar emojis. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (emojiId: number) => {
    const emoji = allEmojis.find(e => e.id === emojiId);
    if (!emoji) return;

    const newIsLiked = !emoji.isLiked;
    try {
      const response = await fetch('/api/emojis/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emojiId, like: newIsLiked }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar curtida');
      }

      const data = await response.json();

      setAllEmojis(prevEmojis => 
        prevEmojis.map(e => 
          e.id === emojiId 
            ? { ...e, isLiked: newIsLiked, likes: data.likes_count } 
            : e
        )
      );
    } catch (error) {
      console.error('Erro ao curtir emoji:', error);
      alert('Falha ao curtir emoji. Por favor, tente novamente.');
    }
  };

  const handleDownload = (src: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `emoji-${prompt.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">Emoji Maker</h1>
      <div className="mb-6">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Digite um prompt para seu emoji"
          className="w-full border border-gray-300 rounded-md px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full px-4 py-2 rounded-md text-white ${
            isLoading ? 'bg-gray-400' : 'bg-black hover:bg-gray-800'
          } focus:outline-none focus:ring-2 focus:ring-gray-500`}
        >
          {isLoading ? 'Gerando...' : 'Gerar Emoji'}
        </button>
      </div>
      
      {currentEmoji && (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Emoji gerado para: &ldquo;{currentEmoji.prompt}&rdquo;</h2>
          <Image
            src={currentEmoji.src}
            alt={`Emoji gerado para ${currentEmoji.prompt}`}
            width={200}
            height={200}
            className="mx-auto"
          />
          <button
            onClick={() => handleDownload(currentEmoji.src, currentEmoji.prompt)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Download
          </button>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Histórico de Emojis</h2>
      <div className="grid grid-cols-2 gap-4">
        {generatedEmojis.map((emoji, index) => (
          <div key={index} className="relative group border border-gray-200 rounded-md p-4">
            <Image
              src={emoji.src}
              alt={`Emoji gerado ${index + 1}`}
              width={100}
              height={100}
              className="w-full h-auto"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">{emoji.prompt}</p>
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={() => handleLike(emoji.id)} 
                className={`rounded-full p-2 mx-1 transition-colors duration-300 ${
                  emoji.isLiked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={emoji.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={() => handleDownload(emoji.src, emoji.prompt)}
                className="bg-white text-black rounded-full p-2 mx-1 hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">{emoji.likes} curtidas</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-4">Todos os Emojis</h2>
      <div className="grid grid-cols-2 gap-4">
        {allEmojis.map((emoji) => (
          <div key={emoji.id} className="relative group border border-gray-200 rounded-md p-4">
            <Image
              src={emoji.src}
              alt={`Emoji ${emoji.id}`}
              width={100}
              height={100}
              className="w-full h-auto"
            />
            <p className="text-sm text-gray-600 mt-2 text-center">{emoji.prompt}</p>
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={() => handleLike(emoji.id)} 
                className={`rounded-full p-2 mx-1 transition-colors duration-300 ${
                  emoji.isLiked ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill={emoji.isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button
                onClick={() => handleDownload(emoji.src, emoji.prompt)}
                className="bg-white text-black rounded-full p-2 mx-1 hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2 text-center">{emoji.likes} curtidas</p>
          </div>
        ))}
      </div>
    </div>
  );
}
