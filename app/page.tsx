export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-8">
      <div className="text-center max-w-xl">
        <h1 className="text-4xl font-bold mb-4">Spinly Marketing</h1>
        <p className="text-zinc-400 mb-8">
          Système interne d&apos;automation de contenu Instagram. Accès restreint à l&apos;admin Spinly.
        </p>
        <a
          href="/admin"
          className="inline-block px-6 py-3 bg-zinc-100 text-zinc-950 rounded-lg font-medium hover:bg-white transition"
        >
          Dashboard admin →
        </a>
      </div>
    </main>
  )
}
