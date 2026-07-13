import { STAG_VIEWBOX, STAG_PATH } from './stagPath';

interface StagLogoProps {
  size?: number;
  className?: string;
  /** Kept for API compatibility; the reference mark has no separate crown. */
  crowned?: boolean;
  title?: string;
}

/**
 * The Crown Season emblem — a geometric stag head, vectorized from the
 * provided reference. Uses `currentColor` so it inherits the surrounding
 * text color (gold on obsidian by default) and reskins cleanly.
 */
export default function StagLogo({ size = 64, className, title = 'The Crown Season' }: StagLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={STAG_VIEWBOX}
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <path fillRule="evenodd" clipRule="evenodd" d={STAG_PATH} />
    </svg>
  );
}
