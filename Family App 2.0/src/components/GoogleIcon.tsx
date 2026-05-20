/**
 * Multi-color Google "G" logo, sized for the Login CTA.
 *
 * The four canonical fill colors (#FFC107 yellow, #FF3D00 red, #4CAF50 green,
 * #1976D2 blue) are part of Google's brand contract — they live as raw hex
 * inline in the SVG and are NOT replaced with theme tokens. This SVG is the
 * only Phase 1 surface where raw hex is allowed; UI-SPEC §Voice and Tone
 * carves the brand mark out of the "all colors via var(--token)" rule.
 *
 * Ported verbatim from v1 ../family-app/src/pages/Login.jsx (lines 39–48),
 * resized from 20×20 → 18×18 per PATTERNS.md Task 3.2 spec.
 */
export default function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="18"
      height="18"
      viewBox="0 0 24 24"
    >
      <path
        fill="#FFC107"
        d="M21.8 10.05H21V10H12v4h5.65C16.85 16.35 14.6 18 12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6c1.55 0 2.9.6 3.95 1.55l2.85-2.85C17.25 3.25 14.75 2 12 2 6.45 2 2 6.45 2 12s4.45 10 10 10 10-4.45 10-10c0-.65-.05-1.35-.2-1.95z"
      />
      <path
        fill="#FF3D00"
        d="M3.15 7.35l3.3 2.4C7.25 8 9.5 6 12 6c1.55 0 2.9.6 3.95 1.55l2.85-2.85C17.25 3.25 14.75 2 12 2 8.15 2 4.85 4.15 3.15 7.35z"
      />
      <path
        fill="#4CAF50"
        d="M12 22c2.6 0 4.95-1 6.7-2.6l-3.1-2.6C14.6 17.65 13.35 18 12 18c-2.6 0-4.8-1.65-5.65-4H3.15C4.85 19.8 8.15 22 12 22z"
      />
      <path
        fill="#1976D2"
        d="M21.8 10.05H21V10H12v4h5.65c-.4 1.15-1.15 2.1-2.1 2.8l3.1 2.6C20.7 17.55 22 14.95 22 12c0-.65-.05-1.35-.2-1.95z"
      />
    </svg>
  );
}
