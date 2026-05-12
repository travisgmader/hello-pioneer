# Sovereign Anubis — Design Reference

Three HTML mockups defining the visual design language for Clay and Steel.
Colors, typography, spacing, and component patterns all derive from these screens.

---

## Screen 1 — Design System

<!-- Design System -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Manrope:wght@400;600&family=Space+Grotesk:wght@600&display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        "colors": {
          "surface-container-high": "#2a2a2a",
          "surface-container-low": "#1c1b1b",
          "surface-container": "#201f1f",
          "outline": "#99907c",
          "on-secondary-container": "#9bb3fd",
          "surface-variant": "#353534",
          "on-error-container": "#ffdad6",
          "secondary-fixed-dim": "#b3c5ff",
          "secondary-fixed": "#dbe1ff",
          "surface-bright": "#3a3939",
          "on-primary-fixed": "#241a00",
          "on-primary-fixed-variant": "#574500",
          "on-error": "#690005",
          "secondary": "#b3c5ff",
          "on-tertiary": "#003732",
          "inverse-on-surface": "#313030",
          "on-surface": "#e5e2e1",
          "primary-container": "#d4af37",
          "on-secondary-fixed-variant": "#2a4386",
          "tertiary": "#46e4d4",
          "surface-dim": "#131313",
          "inverse-primary": "#735c00",
          "on-tertiary-container": "#004e47",
          "on-surface-variant": "#d0c5af",
          "surface-container-highest": "#353534",
          "primary": "#f2ca50",
          "on-tertiary-fixed": "#00201d",
          "tertiary-fixed": "#61f9e9",
          "surface": "#131313",
          "inverse-surface": "#e5e2e1",
          "on-primary-container": "#554300",
          "primary-fixed": "#ffe088",
          "tertiary-fixed-dim": "#3adccc",
          "surface-tint": "#e9c349",
          "background": "#131313",
          "outline-variant": "#4d4635",
          "on-primary": "#3c2f00",
          "tertiary-container": "#09c8b9",
          "error-container": "#93000a",
          "on-background": "#e5e2e1",
          "on-tertiary-fixed-variant": "#005049",
          "on-secondary": "#0d2c6e",
          "primary-fixed-dim": "#e9c349",
          "error": "#ffb4ab",
          "secondary-container": "#2a4386",
          "surface-container-lowest": "#0e0e0e",
          "on-secondary-fixed": "#00174a"
        },
        "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
        },
        "spacing": {
          "unit": "8px",
          "margin-mobile": "16px",
          "container-max": "1280px",
          "gutter": "24px",
          "margin-desktop": "64px"
        },
        "fontFamily": {
          "label-caps": ["Space Grotesk"],
          "body-md": ["Manrope"],
          "headline-xl": ["Noto Serif"],
          "headline-md": ["Noto Serif"],
          "body-lg": ["Manrope"],
          "headline-lg": ["Noto Serif"]
        },
        "fontSize": {
          "label-caps": ["12px", {"lineHeight": "1", "letterSpacing": "0.2em", "fontWeight": "600"}],
          "body-md": ["16px", {"lineHeight": "1.5", "fontWeight": "400"}],
          "headline-xl": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
          "headline-md": ["24px", {"lineHeight": "1.3", "letterSpacing": "0.02em", "fontWeight": "600"}],
          "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
          "headline-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}]
        }
      }
    }
  }
</script>
<style>
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
  .obsidian-texture {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    background-repeat: repeat;
    opacity: 0.05;
  }
  .gold-shimmer {
    background: linear-gradient(45deg, #d4af37 0%, #f2ca50 50%, #d4af37 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .notch-corner {
    clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
  }
</style>
</head>
<body class="bg-surface text-on-surface font-body-md overflow-hidden">
<div class="fixed inset-0 obsidian-texture pointer-events-none"></div>
<div class="fixed inset-0 bg-gradient-to-b from-stone-950/50 via-stone-900/20 to-stone-950/80 pointer-events-none"></div>
<main class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 overflow-hidden">
  <header class="absolute top-0 w-full flex justify-center py-12">
    <h1 class="font-headline-md text-label-caps uppercase tracking-[0.4em] text-primary/60 border-b border-primary/20 pb-2">Sovereign Anubis</h1>
  </header>
  <div class="relative w-full max-w-lg aspect-square flex items-center justify-center">
    <div class="absolute inset-0 border-[1px] border-primary/30 rounded-full scale-110 blur-[1px]"></div>
    <div class="absolute inset-0 border-[0.5px] border-primary/10 rounded-full scale-125"></div>
    <div class="relative z-10 w-full h-full p-8">
      <img
        alt="Modern Geometric Anubis Illustration"
        class="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(212,175,55,0.4)]"
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuChpjSrlAu3_JOAPL24MEyb4CCGqO9lzDW6d3BLIdBadR6jRoLaooNMo9DB7JMgft_5ucB6YBYrWTf3nghtHaWMQGzbHmcEjtrb50pzpIaXLpV9YxxHpy1D-MoAGmr5QfAOHD3LwUdmsMZzrFzSjNjlJ8Y4Vai2RJKVNew0_GAADK81yzwiZeXp1O3ms5Y3P3ZrI3jO6ciVtaEljxXGmqFMjdQuBHZBu245O_4OA9FhiwzWaFLe0NRz9TUtJmmZjNWnrMtrpp1ZRgo"
      />
    </div>
    <div class="absolute -left-12 top-1/2 -rotate-90">
      <span class="font-label-caps text-primary/40 text-[10px]">PRESERVATION</span>
    </div>
    <div class="absolute -right-12 top-1/2 rotate-90">
      <span class="font-label-caps text-primary/40 text-[10px]">JUDGEMENT</span>
    </div>
  </div>
  <div class="mt-16 text-center max-w-2xl space-y-8">
    <div class="space-y-4">
      <h2 class="font-headline-xl text-headline-xl gold-shimmer uppercase tracking-tighter">The Scales Await</h2>
      <p class="font-body-lg text-body-lg text-on-surface-variant/80 max-w-md mx-auto leading-relaxed">Enter the digital sanctum where ancient wisdom meets sovereign luxury. Your journey through the Duat begins now.</p>
    </div>
    <div class="flex flex-col items-center gap-6 pt-4">
      <button class="group relative px-12 py-4 bg-primary text-on-primary font-label-caps notch-corner transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
        <span class="relative z-10">Begin Journey</span>
        <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>
      <button class="font-label-caps text-primary/60 hover:text-primary transition-colors flex items-center gap-2">
        <span class="material-symbols-outlined text-sm">auto_awesome</span>
        View Mysteries
      </button>
    </div>
  </div>
  <div class="absolute bottom-24 flex items-center gap-4 w-full px-12 opacity-30">
    <div class="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary"></div>
    <div class="flex gap-2">
      <div class="w-2 h-2 rotate-45 border border-primary"></div>
      <div class="w-2 h-2 rotate-45 bg-primary"></div>
      <div class="w-2 h-2 rotate-45 border border-primary"></div>
    </div>
    <div class="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary"></div>
  </div>
  <footer class="absolute bottom-8 w-full px-12 flex justify-between items-center opacity-40">
    <div class="font-label-caps text-[10px]">INITIATE LEVEL IV</div>
    <div class="font-label-caps text-[10px]">OSIRIS ERA 2024</div>
  </footer>
</main>
</body></html>

---

## Screen 2 — Splash Screen / Grand Hall

<!-- Splash Screen -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        "colors": {
          "surface-container-high": "#2a2a2a",
          "surface-container-low": "#1c1b1b",
          "surface-container": "#201f1f",
          "outline": "#99907c",
          "on-secondary-container": "#9bb3fd",
          "surface-variant": "#353534",
          "on-error-container": "#ffdad6",
          "secondary-fixed-dim": "#b3c5ff",
          "secondary-fixed": "#dbe1ff",
          "surface-bright": "#3a3939",
          "on-primary-fixed": "#241a00",
          "on-primary-fixed-variant": "#574500",
          "on-error": "#690005",
          "secondary": "#b3c5ff",
          "on-tertiary": "#003732",
          "inverse-on-surface": "#313030",
          "on-surface": "#e5e2e1",
          "primary-container": "#d4af37",
          "on-secondary-fixed-variant": "#2a4386",
          "tertiary": "#46e4d4",
          "surface-dim": "#131313",
          "inverse-primary": "#735c00",
          "on-tertiary-container": "#004e47",
          "on-surface-variant": "#d0c5af",
          "surface-container-highest": "#353534",
          "primary": "#f2ca50",
          "on-tertiary-fixed": "#00201d",
          "tertiary-fixed": "#61f9e9",
          "surface": "#131313",
          "inverse-surface": "#e5e2e1",
          "on-primary-container": "#554300",
          "primary-fixed": "#ffe088",
          "tertiary-fixed-dim": "#3adccc",
          "surface-tint": "#e9c349",
          "background": "#131313",
          "outline-variant": "#4d4635",
          "on-primary": "#3c2f00",
          "tertiary-container": "#09c8b9",
          "error-container": "#93000a",
          "on-background": "#e5e2e1",
          "on-tertiary-fixed-variant": "#005049",
          "on-secondary": "#0d2c6e",
          "primary-fixed-dim": "#e9c349",
          "error": "#ffb4ab",
          "secondary-container": "#2a4386",
          "surface-container-lowest": "#0e0e0e",
          "on-secondary-fixed": "#00174a"
        },
        "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
        },
        "spacing": {
          "unit": "8px",
          "margin-mobile": "16px",
          "container-max": "1280px",
          "gutter": "24px",
          "margin-desktop": "64px"
        },
        "fontFamily": {
          "label-caps": ["Space Grotesk"],
          "body-md": ["Manrope"],
          "headline-xl": ["Noto Serif"],
          "headline-md": ["Noto Serif"],
          "body-lg": ["Manrope"],
          "headline-lg": ["Noto Serif"]
        },
        "fontSize": {
          "label-caps": ["12px", {"lineHeight": "1", "letterSpacing": "0.2em", "fontWeight": "600"}],
          "body-md": ["16px", {"lineHeight": "1.5", "fontWeight": "400"}],
          "headline-xl": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
          "headline-md": ["24px", {"lineHeight": "1.3", "letterSpacing": "0.02em", "fontWeight": "600"}],
          "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
          "headline-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}]
        }
      }
    }
  }
</script>
<style>
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
  .hierarchical-pattern {
    background-color: #131313;
    background-image: radial-gradient(#d4af37 0.5px, transparent 0.5px);
    background-size: 32px 32px;
    background-position: 0 0, 16px 16px;
    opacity: 0.05;
  }
  .obsidian-texture {
    background: linear-gradient(145deg, #1c1b1b 0%, #0e0e0e 100%);
  }
  .gold-frame {
    position: relative;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }
  .gold-frame::before, .gold-frame::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #d4af37;
  }
  .gold-frame::before { top: -1px; left: -1px; border-right: 0; border-bottom: 0; }
  .gold-frame::after  { bottom: -1px; right: -1px; border-left: 0; border-top: 0; }
</style>
</head>
<body class="bg-background text-on-surface font-body-md min-h-screen relative">
<div class="fixed inset-0 hierarchical-pattern pointer-events-none"></div>
<header class="bg-stone-950/95 flex justify-between items-center w-full px-6 py-4 backdrop-blur-md sticky top-0 z-50 border-b border-yellow-700/30 shadow-[0_2px_15px_-3px_rgba(212,175,55,0.2)]">
  <div class="flex items-center gap-4">
    <button class="text-yellow-600 dark:text-yellow-500">
      <span class="material-symbols-outlined">menu</span>
    </button>
    <h1 class="text-xl font-bold tracking-[0.2em] text-yellow-500 drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] font-serif uppercase">Sovereign Anubis</h1>
  </div>
  <div class="w-10 h-10 rounded-full border border-yellow-600/50 overflow-hidden">
    <img alt="Pharaonic Profile" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMOjuzmkDx1gW5wW9HI03BuyxWLQaZu9I8AilmerzbG6R-h1ovuwSaG7eWfHKLdayzSk5_adetOuh-W4KZcmHZr6_vg0ZbJetyJbOqnL-oHiunMGjuQSNfCsfDuaBVwHf64c9Wd5dOwbKaCQuv3S_GXXVJ-lCbCvIw0XdYyP-DfzKQx9rf7sNeCx_47qNgtxW09nLm6fARMhKBrNAemOjjaXGUdGP4k9ZYxJPGCCLWxYu_s3luHBRGDQYVgjqYfxLbWheTPYSVwq0"/>
  </div>
</header>
<main class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 pb-32">
  <section class="mb-12">
    <div class="flex flex-col gap-2 mb-8">
      <span class="font-label-caps text-label-caps text-primary uppercase">Current Domain</span>
      <h2 class="font-headline-xl text-headline-xl text-on-surface">The Grand Hall</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-12 gap-gutter">
      <div class="md:col-span-8 group relative overflow-hidden rounded-lg gold-frame obsidian-texture p-8 flex flex-col justify-end min-h-[400px] transition-all hover:border-yellow-500/60 shadow-2xl">
        <div class="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
          <img alt="Temple of Truth" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0xWXF8F-Le54aokiWHCrtnDZKo0n3ogHGnJfQjiszYPZm5jdhIph_RaLANuG3OMCmkvCJbCxThbKKEdUbH1KJcaD0aZZyQ08V8EJxKvdcTyP0kQEw6FC67q7nUV-cRerBeYNZKN_QfBWMHQQIyf_6AulMxiaXHRi2rvdN-TzCanfr93pHu2VEBA-TuZq07Mwpbwv6Oyp_z0pvqdnSnNDcLXsu3uSjjrx1NCAzrdlP8DDtG3ko7bPL-kSyJ9GAkT0jPmOaFjPOHDU"/>
          <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>
        <div class="relative z-10">
          <span class="font-label-caps text-label-caps text-tertiary mb-2 block uppercase">Primary Sanctum</span>
          <h3 class="font-headline-lg text-headline-lg text-primary mb-4">Temple of Truth</h3>
          <p class="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-6">Access the archives of the divine.</p>
          <button class="bg-primary-container text-on-primary-container px-8 py-3 rounded-DEFAULT font-label-caps text-label-caps hover:bg-primary transition-colors uppercase">Enter Sanctuary</button>
        </div>
      </div>
      <div class="md:col-span-4 flex flex-col gap-gutter">
        <div class="flex-1 gold-frame obsidian-texture p-6 flex flex-col justify-between hover:border-yellow-500/60 transition-all">
          <div class="flex justify-between items-start">
            <span class="material-symbols-outlined text-primary text-4xl">travel_explore</span>
            <span class="font-label-caps text-[10px] text-tertiary border border-tertiary/30 px-2 py-1 rounded-full uppercase">3 New</span>
          </div>
          <div>
            <h4 class="font-headline-md text-headline-md text-on-surface mb-2">Hidden Tombs</h4>
            <p class="font-body-md text-body-md text-on-surface-variant">Navigate the labyrinth of the forgotten kings.</p>
          </div>
        </div>
        <div class="flex-1 gold-frame obsidian-texture p-6 flex flex-col justify-between hover:border-yellow-500/60 transition-all">
          <div class="flex justify-between items-start">
            <span class="material-symbols-outlined text-primary text-4xl">auto_stories</span>
            <span class="font-label-caps text-[10px] text-outline border border-outline/30 px-2 py-1 rounded-full uppercase">Archived</span>
          </div>
          <div>
            <h4 class="font-headline-md text-headline-md text-on-surface mb-2">Ancient Scrolls</h4>
            <p class="font-body-md text-body-md text-on-surface-variant">Decipher the sacred texts of the Nile's eternal flow.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
    <div class="p-6 border-b border-yellow-700/20 flex items-center gap-6">
      <span class="material-symbols-outlined text-primary-container text-4xl">history_edu</span>
      <div>
        <div class="font-label-caps text-[10px] text-outline uppercase">Active Quest</div>
        <div class="font-headline-md text-body-lg text-on-surface">The Eye of Ra</div>
      </div>
    </div>
    <div class="p-6 border-b border-yellow-700/20 flex items-center gap-6">
      <span class="material-symbols-outlined text-tertiary text-4xl">diamond</span>
      <div>
        <div class="font-label-caps text-[10px] text-outline uppercase">Sacred Wealth</div>
        <div class="font-headline-md text-body-lg text-on-surface">1,240 Deben</div>
      </div>
    </div>
    <div class="p-6 border-b border-yellow-700/20 flex items-center gap-6">
      <span class="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
      <div>
        <div class="font-label-caps text-[10px] text-outline uppercase">Ritual Rank</div>
        <div class="font-headline-md text-body-lg text-on-surface">Initiate IV</div>
      </div>
    </div>
  </section>
</main>
<footer class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe bg-stone-950 border-t border-yellow-700/30 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.8)]">
  <a class="flex flex-col items-center justify-center text-yellow-500 drop-shadow-[0_0_5px_rgba(212,175,55,0.6)] py-4" href="#">
    <span class="material-symbols-outlined mb-1">account_balance</span>
    <span class="font-serif text-[10px] uppercase tracking-tighter">Temple</span>
  </a>
  <a class="flex flex-col items-center justify-center text-stone-700 py-4" href="#">
    <span class="material-symbols-outlined mb-1">auto_awesome</span>
    <span class="font-serif text-[10px] uppercase tracking-tighter">Mysteries</span>
  </a>
  <a class="flex flex-col items-center justify-center text-stone-700 py-4" href="#">
    <span class="material-symbols-outlined mb-1">diamond</span>
    <span class="font-serif text-[10px] uppercase tracking-tighter">Treasury</span>
  </a>
  <a class="flex flex-col items-center justify-center text-stone-700 py-4" href="#">
    <span class="material-symbols-outlined mb-1">history_edu</span>
    <span class="font-serif text-[10px] uppercase tracking-tighter">Scribe</span>
  </a>
</footer>
<button class="fixed bottom-24 right-8 w-16 h-16 bg-primary rounded-full shadow-[0_0_20px_rgba(242,202,80,0.4)] flex items-center justify-center text-on-primary hover:scale-110 transition-all z-40 border border-yellow-300/30">
  <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">explore</span>
</button>
</body></html>

---

## Screen 3 — Main Dashboard / Artifact Detail

<!-- Main Dashboard -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&family=Manrope:wght@200..800&family=Noto+Serif:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<script id="tailwind-config">
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        "colors": {
          "surface-container-high": "#2a2a2a",
          "surface-container-low": "#1c1b1b",
          "surface-container": "#201f1f",
          "outline": "#99907c",
          "on-secondary-container": "#9bb3fd",
          "surface-variant": "#353534",
          "on-error-container": "#ffdad6",
          "secondary-fixed-dim": "#b3c5ff",
          "secondary-fixed": "#dbe1ff",
          "surface-bright": "#3a3939",
          "on-primary-fixed": "#241a00",
          "on-primary-fixed-variant": "#574500",
          "on-error": "#690005",
          "secondary": "#b3c5ff",
          "on-tertiary": "#003732",
          "inverse-on-surface": "#313030",
          "on-surface": "#e5e2e1",
          "primary-container": "#d4af37",
          "on-secondary-fixed-variant": "#2a4386",
          "tertiary": "#46e4d4",
          "surface-dim": "#131313",
          "inverse-primary": "#735c00",
          "on-tertiary-container": "#004e47",
          "on-surface-variant": "#d0c5af",
          "surface-container-highest": "#353534",
          "primary": "#f2ca50",
          "on-tertiary-fixed": "#00201d",
          "tertiary-fixed": "#61f9e9",
          "surface": "#131313",
          "inverse-surface": "#e5e2e1",
          "on-primary-container": "#554300",
          "primary-fixed": "#ffe088",
          "tertiary-fixed-dim": "#3adccc",
          "surface-tint": "#e9c349",
          "background": "#131313",
          "outline-variant": "#4d4635",
          "on-primary": "#3c2f00",
          "tertiary-container": "#09c8b9",
          "error-container": "#93000a",
          "on-background": "#e5e2e1",
          "on-tertiary-fixed-variant": "#005049",
          "on-secondary": "#0d2c6e",
          "primary-fixed-dim": "#e9c349",
          "error": "#ffb4ab",
          "secondary-container": "#2a4386",
          "surface-container-lowest": "#0e0e0e",
          "on-secondary-fixed": "#00174a"
        },
        "borderRadius": {
          "DEFAULT": "0.25rem",
          "lg": "0.5rem",
          "xl": "0.75rem",
          "full": "9999px"
        },
        "spacing": {
          "unit": "8px",
          "margin-mobile": "16px",
          "container-max": "1280px",
          "gutter": "24px",
          "margin-desktop": "64px"
        },
        "fontFamily": {
          "label-caps": ["Space Grotesk"],
          "body-md": ["Manrope"],
          "headline-xl": ["Noto Serif"],
          "headline-md": ["Noto Serif"],
          "body-lg": ["Manrope"],
          "headline-lg": ["Noto Serif"]
        },
        "fontSize": {
          "label-caps": ["12px", {"lineHeight": "1", "letterSpacing": "0.2em", "fontWeight": "600"}],
          "body-md": ["16px", {"lineHeight": "1.5", "fontWeight": "400"}],
          "headline-xl": ["48px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
          "headline-md": ["24px", {"lineHeight": "1.3", "letterSpacing": "0.02em", "fontWeight": "600"}],
          "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "400"}],
          "headline-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}]
        }
      }
    }
  }
</script>
<style>
  .obsidian-grain {
    background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuCEzSVBM5r6rpSdCoY8tVjwelz5KsnKzHD19zFKuhBKdv6woB997UkPHs7RnrWybs-OXKE9MNuSGqpqa_dHdL508Rh6SQqY_Tx4MAbCds6b6A4HDnUjJzkA02GtWQ38HupciruBdoHWLyyfuYqfv4A9QtePoFKmzaZ5dzsLDWezZ2i2gAEmMgsWL1dtmx4CEVvYwIiZYVIY5_3qGn8M3cjFONT6acq8zPEsNxi10ECiw2FiS0DMM6E-t8fzsDqW9AfmmiaFnqLgTr0);
    background-repeat: repeat;
  }
  .gold-leaf-border {
    border-image: linear-gradient(to bottom, #d4af37, #f2ca50, #d4af37) 1;
  }
  .papyrus-texture {
    background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuCcAUvL-WupWSN-HMDMuqtT5q9-Y4uC8_eQS7kLVbyQ3Q_VLUXscmwCpvf3AoPaTJtNE1-bjCbVmqNegN4Pcaip9qkOoL7tI-8f6vpgS9ZgyrmcThK2R9Dt1facoLPELEEEfZvD0ikfm6FAxaHl1OAnEkCf_ty6j0Y1aWld-Mp978HRX5kKSXzk0dnvJytwJWJQSirvUnERfNMy1GfUpkQbA7mestHoq-Q0RD-Ono4x_BTFxTS4wL-d4U-cmIenwqfGgFBMb0mfZnY);
  }
  .material-symbols-outlined {
    font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
  }
</style>
</head>
<body class="bg-stone-950 text-on-background font-body-md obsidian-grain">
<header class="bg-stone-950/95 flex justify-between items-center w-full px-6 py-4 backdrop-blur-md sticky top-0 z-50 border-b border-yellow-700/30 shadow-[0_2px_15px_-3px_rgba(212,175,55,0.2)]">
  <div class="flex items-center gap-4">
    <button class="text-yellow-600 dark:text-yellow-500">
      <span class="material-symbols-outlined">menu</span>
    </button>
    <h1 class="font-serif tracking-widest uppercase text-yellow-500 text-xl font-bold tracking-[0.2em] drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">Sovereign Anubis</h1>
  </div>
  <div class="w-10 h-10 rounded-full border border-yellow-700/50 overflow-hidden shadow-[0_0_10px_rgba(212,175,55,0.3)]">
    <img alt="Pharaonic Profile" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2jXXPQBar9dlKHPHhxYQrMiLYeQbRrW_mPAyrhQSWrD0Z9mp9habWQ5HK6Qlp7WS8IKUaCu3kvBHwgfK8byyULA90I3WT9IgGh3OsHt89yW8XSImMYQ5oJ2H7pM-Mq5mnvHaJocZ8YxDE8utAEXH2_OBXAsNVRheU2rfrOVYY8QLTDhy_9h64rGXiKzwCZUIY7xFvfdmpQbO6HNjHV0XJvRbdSKjrrwzpjBdO8Em7h6dp5uUU6kU8eaeVaSysj9AY1kpVtdNuD2g"/>
  </div>
</header>
<main class="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop py-8 pb-32">
  <section class="relative w-full aspect-video md:aspect-[21/9] rounded-lg overflow-hidden border border-yellow-700/40 shadow-2xl mb-12">
    <img alt="The Obsidian Heart of Osiris" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-p0u49cj-ujliQuW1gaxro5H5yT68am2P5IG35Qy-7Q_qEYhlpp6z91yHupDum89QXCGewdJiKcqvZ4miN7WN-e-AZCrVIhIy1bhX0hX4T3QKIX5pJLn6y2ZzNlEcaX0sTUQFAfcDJ9de_PQjkd1cdvOLU5sry3IX4NNlWlTejd0HtUUdddLf1ZqNmLkzEK4-JPffzcdps_JAmMAYaF3wzpr0MDatrPAjznZYQObRi0ZaoWq5nsXoWxT6ZEyMnWfDFVgoHXK2XBM"/>
    <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-80"></div>
    <div class="absolute bottom-0 left-0 p-8">
      <span class="font-label-caps text-label-caps bg-secondary-container/40 text-on-secondary-container px-3 py-1 rounded backdrop-blur-sm border border-secondary/20 mb-4 inline-block">Mythical Relic</span>
      <h2 class="font-headline-xl text-headline-xl text-primary drop-shadow-md">The Obsidian Heart of Osiris</h2>
    </div>
  </section>
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
    <aside class="lg:col-span-4 order-2 lg:order-1 space-y-8">
      <div class="bg-surface-container-low border border-yellow-700/30 p-6 rounded-lg papyrus-texture relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-1 bg-yellow-600/50"></div>
        <h3 class="font-label-caps text-label-caps text-primary-fixed mb-6">Artifact Provenance</h3>
        <div class="space-y-6">
          <div class="flex flex-col gap-1">
            <span class="font-label-caps text-[10px] text-outline uppercase tracking-widest">Era</span>
            <span class="font-headline-md text-headline-md text-on-surface">Late Kingdom (Dynasty XXVI)</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-label-caps text-[10px] text-outline uppercase tracking-widest">Material</span>
            <span class="font-headline-md text-headline-md text-on-surface">Obsidian, 24k Gold, Lapis Lazuli</span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-label-caps text-[10px] text-outline uppercase tracking-widest">Status</span>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-tertiary-container shadow-[0_0_8px_rgba(9,200,185,0.8)]"></div>
              <span class="font-body-md text-on-surface font-semibold">Secured in Sanctuary</span>
            </div>
          </div>
        </div>
        <div class="mt-8 pt-6 border-t border-yellow-900/20">
          <button class="w-full bg-primary text-on-primary py-3 rounded-sm font-label-caps hover:bg-primary-container transition-all flex items-center justify-center gap-2">
            <span>Request Viewing</span>
            <span class="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>
    </aside>
    <article class="lg:col-span-8 order-1 lg:order-2">
      <div class="prose prose-invert max-w-none space-y-8">
        <div class="flex items-center gap-4 mb-4">
          <div class="h-[1px] flex-grow bg-gradient-to-r from-transparent via-yellow-700/50 to-transparent"></div>
          <span class="material-symbols-outlined text-yellow-500">diamond</span>
          <div class="h-[1px] flex-grow bg-gradient-to-r from-transparent via-yellow-700/50 to-transparent"></div>
        </div>
        <p class="font-headline-md text-headline-md text-on-surface-variant leading-relaxed">Deep within the silent corridors of the Valley of the Kings, the Obsidian Heart remained untouched for millennia.</p>
        <h3 class="font-headline-lg text-headline-lg text-primary pt-6">The Ritual of the Scale</h3>
        <p class="font-body-md text-body-md text-on-surface-variant/80 leading-relaxed">To modern eyes, it is a masterpiece of geometry and stonework. To the initiated, it is a key.</p>
      </div>
    </article>
  </div>
</main>
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-safe bg-stone-950 border-t border-yellow-700/30 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.8)]">
  <a class="flex flex-col items-center justify-center text-stone-700 py-2" href="#">
    <span class="material-symbols-outlined">account_balance</span>
    <span class="font-serif text-[10px] uppercase tracking-tighter">Temple</span>
  </a>
  <a class="flex flex-col items-center justify-center text-yellow-500 drop-shadow-[0_0_5px_rgba(212,175,55,0.6)] py-2" href="#">
    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">auto_awesome</span>
    <span class="font-serif text-[10px] uppercase tracking-tighter">Mysteries</span>
  </a>
  <a class="flex flex-col items-center justify-center text-stone-700 py-2" href="#">
    <span class="material-symbols-outlined">diamond</span>
    <span class="font-serif text-[10px] uppercase tracking-tighter">Treasury</span>
  </a>
  <a class="flex flex-col items-center justify-center text-stone-700 py-2" href="#">
    <span class="material-symbols-outlined">history_edu</span>
    <span class="font-serif text-[10px] uppercase tracking-tighter">Scribe</span>
  </a>
</nav>
</body></html>
