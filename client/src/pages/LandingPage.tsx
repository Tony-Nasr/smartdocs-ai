export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-sm">S</span>
          </div>
          <span className="font-semibold text-lg">SmartDocs AI</span>
        </div>
        <a
          href="/login"
          className="bg-white text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition"
        >
          Get Started
        </a>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <div className="inline-block bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs text-white/70 mb-8">
          Powered by LLaMA 3 · Groq AI
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Your documents,<br />
          <span className="text-white/40">understood by AI.</span>
        </h1>
        <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
          Upload any business document. Get instant AI summaries, keyword extraction,
          and chat with your files — grounded answers, no hallucinations.
        </p>
        <a
          href="/login"
          className="inline-block bg-white text-black px-8 py-3 rounded-lg font-semibold text-sm hover:bg-white/90 transition"
        >
          Start for free
        </a>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: "⚡",
            title: "Instant Summaries",
            desc: "Upload a PDF and get a clear, concise summary in seconds. No more reading 50-page reports."
          },
          {
            icon: "💬",
            title: "Chat with Documents",
            desc: "Ask any question about your file. The AI answers only from the document — accurate every time."
          },
          {
            icon: "🔒",
            title: "Secure & Private",
            desc: "JWT authentication, refresh tokens, and your documents are only visible to you."
          }
        ].map((f) => (
          <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-8 py-6 text-center text-white/30 text-xs">
        SmartDocs AI · Built with React + ASP.NET Core + PostgreSQL · 
        <a href="https://github.com/Tony-Nasr/smartdocs-ai" className="underline ml-1" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </div>
  )
}