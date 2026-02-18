import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center p-8 font-sans">
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <h1 className="text-2xl font-bold tracking-tight text-rose-500">
          CringeAgent <span className="text-slate-400 text-sm font-normal">v1.0</span>
        </h1>
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-emerald-500 font-medium">SYSTEM ACTIVE</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        
        {/* Stats Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">Automated Replies</p>
          <h2 className="text-4xl font-bold mt-2 text-rose-400">127</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">Active Targets</p>
          <h2 className="text-4xl font-bold mt-2 text-blue-400">03</h2>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-slate-400 text-sm">Relationship Score</p>
          <h2 className="text-4xl font-bold mt-2 text-amber-400">98%</h2>
        </div>

        {/* Console / Log Window */}
        <div className="md:col-span-3 bg-black border border-slate-800 rounded-2xl p-4 font-mono text-sm overflow-hidden">
          <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          </div>
          <div className="space-y-2 text-slate-300">
            <p className="text-emerald-400">[SYSTEM] Initializing WhatsApp Protocol...</p>
            <p className="text-blue-400">[AUTH] Session restored from local_auth</p>
            <p>[LOG] Received: "I miss you" from <span className="text-rose-400">Simran</span></p>
            <p className="text-slate-500">[AI] Generating high-cringe romantic reply...</p>
            <p className="text-emerald-400">[SENT] "Aww, you're the only one I'm thinking about!"</p>
            <p className="animate-pulse text-rose-500 mt-4">_ Waiting for next incoming message...</p>
          </div>
        </div>
      </div>

      <footer className="mt-auto text-slate-600 text-xs">
        Built by Garv Sharma • Developer Mode
      </footer>
    </main>
  );
}
