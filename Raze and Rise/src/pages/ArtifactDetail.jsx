export default function ArtifactDetail({ onNavigate, activeTab = 'mysteries' }) {
  return (
    <div className="bg-stone-950 text-on-background font-body-md min-h-screen relative selection:bg-primary/30">
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
        <div className="w-10 h-10 rounded-full border border-yellow-700/50 overflow-hidden shadow-[0_0_10px_rgba(212,175,55,0.3)]">
          <img
            alt="Pharaonic Profile"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2jXXPQBar9dlKHPHhxYQrMiLYeQbRrW_mPAyrhQSWrD0Z9mp9habWQ5HK6Qlp7WS8IKUaCu3kvBHwgfK8byyULA90I3WT9IgGh3OsHt89yW8XSImMYQ5oJ2H7pM-Mq5mnvHaJocZ8YxDE8utAEXH2_OBXAsNVRheU2rfrOVYY8QLTDhy_9h64rGXiKzwCZUIY7xFvfdmpQbO6HNjHV0XJvRbdSKjrrwzpjBdO8Em7h6dp5uUU6kU8eaeVaSysj9AY1kpVtdNuD2g"
          />
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-8 pb-32">
        {/* Hero */}
        <section className="relative w-full aspect-video md:aspect-[21/9] rounded-lg overflow-hidden border border-yellow-700/40 shadow-2xl mb-12">
          <img
            alt="The Obsidian Heart of Osiris"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-p0u49cj-ujliQuW1gaxro5H5yT68am2P5IG35Qy-7Q_qEYhlpp6z91yHupDum89QXCGewdJiKcqvZ4miN7WN-e-AZCrVIhIy1bhX0hX4T3QKIX5pJLn6y2ZzNlEcaX0sTUQFAfcDJ9de_PQjkd1cdvOLU5sry3IX4NNlWlTejd0HtUUdddLf1ZqNmLkzEK4-JPffzcdps_JAmMAYaF3wzpr0MDatrPAjznZYQObRi0ZaoWq5nsXoWxT6ZEyMnWfDFVgoHXK2XBM"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-0 left-0 p-8">
            <span className="font-label-caps text-label-caps bg-secondary-container/40 text-on-secondary-container px-3 py-1 rounded backdrop-blur-sm border border-secondary/20 mb-4 inline-block">
              Mythical Relic
            </span>
            <h2 className="font-headline-xl text-headline-xl text-primary drop-shadow-md">
              The Obsidian Heart of Osiris
            </h2>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <aside className="lg:col-span-4 order-2 lg:order-1 space-y-8">
            <div className="bg-surface-container-low border border-yellow-700/30 p-6 rounded-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-yellow-600/50" />
              <h3 className="font-label-caps text-label-caps text-primary-fixed mb-6">Artifact Provenance</h3>
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Era</span>
                  <span className="font-headline-md text-headline-md text-on-surface">Late Kingdom (Dynasty XXVI)</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Material</span>
                  <span className="font-headline-md text-headline-md text-on-surface">Obsidian, 24k Gold, Lapis Lazuli</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-label-caps text-[10px] text-outline uppercase tracking-widest">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-tertiary-container shadow-[0_0_8px_rgba(9,200,185,0.8)]" />
                    <span className="font-body-md text-on-surface font-semibold">Secured in Sanctuary</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-yellow-900/20">
                <button className="w-full bg-primary text-on-primary py-3 rounded-sm font-label-caps hover:bg-primary-container transition-all flex items-center justify-center gap-2 group">
                  <span>Request Viewing</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="bg-secondary-container/10 border border-secondary-container/30 p-6 rounded-lg backdrop-blur-md relative">
              <div className="absolute -left-1 top-4 bottom-4 w-1 bg-secondary shadow-[0_0_15px_rgba(155,179,253,0.5)]" />
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined text-secondary">auto_awesome</span>
                <div>
                  <h4 className="font-label-caps text-secondary mb-2">Sacred Properties</h4>
                  <p className="font-body-md text-on-secondary-container/80 text-sm leading-relaxed italic">
                    "The Obsidian Heart is said to pulsate with the rhythmic flow of the Nile, acting as a compass for the soul navigating the Duat."
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* Article */}
          <article className="lg:col-span-8 order-1 lg:order-2">
            <div className="space-y-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-yellow-700/50 to-transparent" />
                <span className="material-symbols-outlined text-yellow-500">diamond</span>
                <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-yellow-700/50 to-transparent" />
              </div>

              <p className="font-headline-md text-headline-md text-on-surface-variant leading-relaxed">
                Deep within the silent corridors of the Valley of the Kings, the Obsidian Heart remained untouched for millennia. It is not merely a stone, but a vessel of memory—a frozen spark of the original solar fire that birthed the world.
              </p>

              <div className="relative py-4 pl-8 border-l-2 border-yellow-500/30">
                <div className="absolute inset-y-0 left-0 w-px bg-yellow-700/40" />
                <p className="font-body-lg text-body-lg text-on-surface/90 leading-loose italic">
                  The myth suggests that when Osiris was scattered across the sands, his essence crystallized into twelve obsidian fragments. This heart, the central fragment, was recovered by Anubis himself, who encased it in solar gold to prevent the encroaching shadow from consuming its light.
                </p>
              </div>

              <h3 className="font-headline-lg text-headline-lg text-primary pt-6">The Ritual of the Scale</h3>
              <p className="font-body-md text-body-md text-on-surface-variant/80 leading-relaxed">
                To modern eyes, it is a masterpiece of geometry and stonework. To the initiated, it is a key. The surface is inscribed with micro-hieroglyphs that only reveal themselves when bathed in the light of the Sirius constellation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-12">
                <div className="aspect-square rounded-lg border border-yellow-700/20 overflow-hidden bg-surface-container shadow-inner">
                  <img
                    alt="Macro detail of hieroglyphs"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCU_iayTg_x-AsL_geN3tXyE2gaazaqfA0QJyGDgs2jmq6GxFkapHD-mwvT23uAVQB_T02WOh75rLm8MwdXr1ACWJ-DqbDTAGecVWowWnv6TOOBJ893vLlE3VSxaH7YwH00wefq4vzGEwo6o8czQ7d9zrFLSl91D1y20z5ANu-ZCgL5raQn049eOGjTCLa8ENdcUIYw63dLeP_rWS-JMNs8_rcGeEBBUReDH73C9yT5Zkxn1WWjIRI6TGC7hhDZ8O579b5fs8DG3qM"
                  />
                </div>
                <div className="aspect-square rounded-lg border border-yellow-700/20 overflow-hidden bg-surface-container shadow-inner">
                  <img
                    alt="Lapis Lazuli fragment"
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_fm4T85waKRIBqkWLP1zKLuwEQF_u3PklaCnq3z-BzHRKW3mF6qc38ci7DpRpy5K15Gsnm_dxl9ETkfqo_CnDsR5biCr6g8EJyWvCghNtv2dvmfsyScmIcFRPjk_qt452oIPbNm8KFi6sLYzaOVboQ_jGZNGuoOmrnNlwzSqev940JoJTJkUFC_5i7nde4WzDxltLB-HLZdQJQ8lfIJ54mdbcmVPHx5NPzL_Br-889sQ1CDNNJG5h4Ek-MohReQAjmT9IoJEvuPU"
                  />
                </div>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant/80 leading-relaxed">
                Those who have stood in its presence report a faint hum, a frequency that resonates with the core of the human spirit. It is the sound of time folding upon itself, connecting the ancient majesty of the Pharaohs with the digital frontier of the modern era.
              </p>
            </div>
          </article>
        </div>
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
            className={`flex flex-col items-center justify-center py-2 transition-all duration-300 ${
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
    </div>
  )
}
