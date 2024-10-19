import EmojiMaker from "../components/EmojiMaker";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <main className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
        <EmojiMaker />
      </main>
    </div>
  );
}
