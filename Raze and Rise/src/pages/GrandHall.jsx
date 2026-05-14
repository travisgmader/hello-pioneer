export default function GrandHall({ onNavigate, activeTab = 'temple' }) {
  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen relative">
      <div className="fixed inset-0 hierarchical-pattern pointer-events-none z-0" />

      {/* Header */}
      <header className="bg-stone-950/95 flex justify-between items-center w-full px-6 py-4 backdrop-blur-md sticky top-0 z-50 border-b border-yellow-700/30 shadow-[0_2px_15px_-3px_rgba(212,175,55,0.2)]">
        <div className="flex items-center gap-4">
          <button className="text-yellow-500 transition-transform active:scale-90">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-serif tracking-[0.2em] uppercase text-primary text-xl font-bold drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
            Sovereign Anubis
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full border border-yellow-600/50 overflow-hidden">
          <img
            alt="Pharaonic Profile"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMOjuzmkDx1gW5wW9HI03BuyxWLQaZu9I8AilmerzbG6R-h1ovuwSaG7eWfHKLdayzSk5_adetOuh-W4KZcmHZr6_vg0ZbJetyJbOqnL-oHiunMGjuQSNfCsfDuaBVwHf64c9Wd5dOwbKaCQuv3S_GXXVJ-lCbCvIw0XdYyP-DfzKQx9rf7sNeCx_47qNgtxW09nLm6fARMhKBrNAemOjjaXGUdGP4k9ZYxJPGCCLWxYu_s3luHBRGDQYVgjqYfxLbWheTPYSVwq0"
          />
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 pb-32 relative z-10">
        <section className="mb-12">
          <div className="flex flex-col gap-2 mb-8">
            <span className="font-label-caps text-label-caps text-primary uppercase">Current Domain</span>
            <h2 className="font-headline-xl text-headline-xl text-on-surface">The Grand Hall</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            {/* Primary card */}
            <div
              className="md:col-span-8 group relative overflow-hidden rounded-lg gold-frame p-8 flex flex-col justify-end min-h-[400px] transition-all hover:border-yellow-500/60 shadow-2xl cursor-pointer"
              style={{ background: 'linear-gradient(145deg, #1c1b1b 0%, #0e0e0e 100%)' }}
              onClick={() => onNavigate?.('artifact')}
            >
              <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                <img
                  alt="Temple of Truth"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0xWXF8F-Le54aokiWHCrtnDZKo0n3ogHGnJfQjiszYPZm5jdhIph_RaLANuG3OMCmkvCBxThbKKEdUbH1KJcaD0aZZyQ08V8EJxKvdcTyP0kQEw6FC67q7nUV-cRerBeYNZKN_QfBWMHQQIyf_6AulMxiaXHRi2rvdN-TzCanfr93pHu2VEBA-TuZq07Mwpbwv6Oyp_z0pvqdnSnNDcLXsu3uSjjrx1NCAzrdlP8DDtG3ko7bPL-kSyJ9GAkT0jPmOaFjPOHDU"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
              <div className="relative z-10">
                <span className="font-label-caps text-label-caps text-tertiary mb-2 block uppercase">Primary Sanctum</span>
                <h3 className="font-headline-lg text-headline-lg text-primary mb-4">Temple of Truth</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-6">
                  Access the archives of the divine. Every pillar holds a secret of the ancient world waiting to be deciphered by the chosen.
                </p>
                <button className="bg-primary-container text-on-primary-container px-8 py-3 rounded font-label-caps text-label-caps hover:bg-primary transition-colors uppercase">
                  Enter Sanctuary
                </button>
              </div>
            </div>

            {/* Secondary cards */}
            <div className="md:col-span-4 flex flex-col gap-gutter">
              <div className="flex-1 gold-frame p-6 flex flex-col justify-between hover:border-yellow-500/60 transition-all rounded-lg"
                style={{ background: 'linear-gradient(145deg, #1c1b1b 0%, #0e0e0e 100%)' }}>
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-primary text-4xl">travel_explore</span>
                  <span className="font-label-caps text-[10px] text-tertiary border border-tertiary/30 px-2 py-1 rounded-full uppercase">3 New</span>
                </div>
                <div>
                  <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Hidden Tombs</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">Navigate the labyrinth of the forgotten kings.</p>
                </div>
              </div>

              <div className="flex-1 gold-frame p-6 flex flex-col justify-between hover:border-yellow-500/60 transition-all rounded-lg"
                style={{ background: 'linear-gradient(145deg, #1c1b1b 0%, #0e0e0e 100%)' }}>
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-primary text-4xl">auto_stories</span>
                  <span className="font-label-caps text-[10px] text-outline border border-outline/30 px-2 py-1 rounded-full uppercase">Archived</span>
                </div>
                <div>
                  <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Ancient Scrolls</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">Decipher the sacred texts of the Nile's eternal flow.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="p-6 border-b border-yellow-700/20 flex items-center gap-6">
            <span className="material-symbols-outlined text-4xl text-primary-container">history_edu</span>
            <div>
              <div className="font-label-caps text-[10px] text-outline uppercase">Active Quest</div>
              <div className="font-body-lg text-on-surface">The Eye of Ra</div>
            </div>
          </div>
          <div className="p-6 border-b border-yellow-700/20 flex items-center gap-6">
            <span className="material-symbols-outlined text-4xl text-tertiary">diamond</span>
            <div>
              <div className="font-label-caps text-[10px] text-outline uppercase">Sacred Wealth</div>
              <div className="font-body-lg text-on-surface">1,240 Deben</div>
            </div>
          </div>
          <div className="p-6 border-b border-yellow-700/20 flex items-center gap-6">
            <span className="material-symbols-outlined text-4xl text-primary">auto_awesome</span>
            <div>
              <div className="font-label-caps text-[10px] text-outline uppercase">Ritual Rank</div>
              <div className="font-body-lg text-on-surface">Initiate IV</div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 bg-stone-950 border-t border-yellow-700/30 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.8)]">
        {[
          { icon: 'account_balance', label: 'Temple', tab: 'temple' },
          { icon: 'auto_awesome', label: 'Mysteries', tab: 'mysteries' },
          { icon: 'diamond', label: 'Treasury', tab: 'treasury' },
          { icon: 'history_edu', label: 'Scribe', tab: 'scribe' },
        ].map(({ icon, label, tab }) => (
          <button
            key={tab}
            onClick={() => onNavigate?.(tab)}
            className={`flex flex-col items-center justify-center py-4 transition-all duration-300 ${
              activeTab === tab
                ? 'text-yellow-500 drop-shadow-[0_0_5px_rgba(212,175,55,0.6)]'
                : 'text-stone-700 hover:text-stone-400'
            }`}
          >
            <span
              className="material-symbols-outlined mb-1"
              style={activeTab === tab ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              {icon}
            </span>
            <span className="font-serif text-[10px] uppercase tracking-tighter">{label}</span>
          </button>
        ))}
      </nav>

      {/* FAB */}
      <button className="fixed bottom-24 right-8 w-16 h-16 bg-primary rounded-full shadow-[0_0_20px_rgba(242,202,80,0.4)] flex items-center justify-center text-on-primary hover:scale-110 active:scale-95 transition-all z-40 border border-yellow-300/30">
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
      </button>
    </div>
  )
}
