export default function SplashScreen({ onBegin }) {
  return (
    <div className="relative bg-surface text-on-surface font-body-md overflow-hidden min-h-screen">
      {/* Background layers */}
      <div className="fixed inset-0 obsidian-texture pointer-events-none z-0" />
      <div className="fixed inset-0 bg-gradient-to-b from-stone-950/50 via-stone-900/20 to-stone-950/80 pointer-events-none z-0" />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden">
        {/* Top branding */}
        <header className="absolute top-0 w-full flex justify-center py-12">
          <h1 className="font-label-caps text-label-caps uppercase tracking-[0.4em] text-primary/60 border-b border-primary/20 pb-2">
            Sovereign Anubis
          </h1>
        </header>

        {/* Central graphic */}
        <div className="relative w-full max-w-lg aspect-square flex items-center justify-center">
          <div className="absolute inset-0 border-[1px] border-primary/30 rounded-full scale-110 blur-[1px]" />
          <div className="absolute inset-0 border-[0.5px] border-primary/10 rounded-full scale-125" />

          <div className="relative z-10 w-full h-full p-8">
            <img
              alt="Modern Geometric Anubis Illustration"
              className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuChpjSrlAu3_JOAPL24MEyb4CCGqO9lzDW6d3BLIdBadR6jRoLaooNMo9DB7JMgft_5ucB6YBYrWTf3nghtHaWMQGzbHmcEjtrb50pzpIaXLpV9YxxHpy1D-MoAGmr5QfAOHD3LwUdmsMZzrFzSjNjlJ8Y4Vai2RJKVNew0_GAADK81yzwiZeXp1O3ms5Y3P3ZrI3jO6ciVtaEljxXGmqFMjdQuBHZBu245O_4OA9FhiwzWaFLe0NRz9TUtJmmZjNWnrMtrpp1ZRgo"
            />
          </div>

          <div className="absolute -left-12 top-1/2 -rotate-90">
            <span className="font-label-caps text-primary/40 text-[10px]">PRESERVATION</span>
          </div>
          <div className="absolute -right-12 top-1/2 rotate-90">
            <span className="font-label-caps text-primary/40 text-[10px]">JUDGEMENT</span>
          </div>
        </div>

        {/* Content & CTA */}
        <div className="mt-16 text-center max-w-2xl space-y-8">
          <div className="space-y-4">
            <h2 className="font-headline-xl text-headline-xl gold-shimmer uppercase tracking-tighter">
              The Scales Await
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant/80 max-w-md mx-auto leading-relaxed">
              Enter the digital sanctum where ancient wisdom meets sovereign luxury. Your journey through the Duat begins now.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 pt-4">
            <button
              onClick={onBegin}
              className="group relative px-12 py-4 bg-primary text-on-primary font-label-caps notch-corner transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
              <span className="relative z-10">Begin Journey</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button className="font-label-caps text-primary/60 hover:text-primary transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              View Mysteries
            </button>
          </div>
        </div>

        {/* Ornate divider */}
        <div className="absolute bottom-24 flex items-center gap-4 w-full px-12 opacity-30">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary" />
          <div className="flex gap-2">
            <div className="w-2 h-2 rotate-45 border border-primary" />
            <div className="w-2 h-2 rotate-45 bg-primary" />
            <div className="w-2 h-2 rotate-45 border border-primary" />
          </div>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary" />
        </div>

        {/* Footer */}
        <footer className="absolute bottom-8 w-full px-12 flex justify-between items-center opacity-40">
          <div className="font-label-caps text-[10px]">INITIATE LEVEL IV</div>
          <div className="font-label-caps text-[10px]">OSIRIS ERA 2024</div>
        </footer>
      </main>
    </div>
  )
}
