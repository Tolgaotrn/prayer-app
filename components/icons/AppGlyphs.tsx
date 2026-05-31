/**
 * AppGlyphs — Bespoke duotone line icons (premium feel)
 *
 * Hepsi 24×24 viewBox, tutarlı 1.7px stroke, yuvarlak köşe. `color` ana çizgi,
 * `tint` yumuşak dolgu (duotone). Home grid + feature ekranlarında kullanılır.
 * Ionicons yerine — özgün İslami marka dili.
 */
import React from 'react';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

export type GlyphProps = { size?: number; color: string; tint?: string };

const SW = 1.7;

function Base({ size = 24, children }: { size?: number; children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

/* ── Mosque — Prayer Times ─────────────────────────────── */
export function MosqueGlyph({ size, color, tint = 'transparent' }: GlyphProps) {
  return (
    <Base size={size}>
      {/* dome + body */}
      <Path d="M6.5 19V12.5C6.5 9 8.6 7 12 7C15.4 7 17.5 9 17.5 12.5V19Z"
        fill={tint} stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      {/* finial crescent */}
      <Path d="M12 7C11.2 6.2 11.2 5 12 4.2C11 4.4 10.4 5.2 10.6 6.1"
        stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      {/* mihrab door */}
      <Path d="M10.3 19V15.6C10.3 14.2 11 13.5 12 13.5C13 13.5 13.7 14.2 13.7 15.6V19"
        stroke={color} strokeWidth={SW} strokeLinecap="round" />
      {/* minarets */}
      <Path d="M4 19V10.5M4 10.5C3.3 10 3.3 9 4 8.6C4.7 9 4.7 10 4 10.5Z"
        stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 19V10.5M20 10.5C19.3 10 19.3 9 20 8.6C20.7 9 20.7 10 20 10.5Z"
        stroke={color} strokeWidth={SW} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1="3" y1="19.2" x2="21" y2="19.2" stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  );
}

/* ── Compass — Qibla ───────────────────────────────────── */
export function CompassGlyph({ size, color, tint = 'transparent' }: GlyphProps) {
  return (
    <Base size={size}>
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={SW} />
      {/* north (filled) */}
      <Path d="M12 5L14 12L12 11.3L10 12Z" fill={color} stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      {/* south (hollow) */}
      <Path d="M12 19L14 12L10 12Z" fill={tint} stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <Circle cx="12" cy="12" r="1.1" fill={color} />
    </Base>
  );
}

/* ── Prayer beads — Tasbih ─────────────────────────────── */
export function BeadsGlyph({ size, color, tint = 'transparent' }: GlyphProps) {
  const beads = Array.from({ length: 10 }).map((_, i) => {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    return { x: 12 + 6.4 * Math.cos(a), y: 10.5 + 6.4 * Math.sin(a) };
  });
  return (
    <Base size={size}>
      {beads.map((b, i) => (
        <Circle key={i} cx={b.x} cy={b.y} r="1.5" fill={i % 3 === 0 ? color : tint} stroke={color} strokeWidth={SW * 0.85} />
      ))}
      {/* tassel */}
      <Line x1="12" y1="17.2" x2="12" y2="20.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <Path d="M10.6 20.5H13.4L12 22.5Z" fill={tint} stroke={color} strokeWidth={SW * 0.85} strokeLinejoin="round" />
    </Base>
  );
}

/* ── Bell — Reminders ──────────────────────────────────── */
export function BellGlyph({ size, color, tint = 'transparent' }: GlyphProps) {
  return (
    <Base size={size}>
      <Path d="M6.5 16.5C6.5 11 8.6 8.5 12 8.5C15.4 8.5 17.5 11 17.5 16.5L18.8 18H5.2Z"
        fill={tint} stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M12 6.2V8.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <Circle cx="12" cy="5.4" r="1.1" fill={color} />
      <Path d="M10 18.5C10 19.6 10.9 20.4 12 20.4C13.1 20.4 14 19.6 14 18.5"
        stroke={color} strokeWidth={SW} strokeLinecap="round" />
    </Base>
  );
}

/* ── Phone + widget — Home Widgets ─────────────────────── */
export function WidgetGlyph({ size, color, tint = 'transparent' }: GlyphProps) {
  return (
    <Base size={size}>
      <Rect x="5" y="2.5" width="14" height="19" rx="3" stroke={color} strokeWidth={SW} />
      <Rect x="7.8" y="5.5" width="8.4" height="5" rx="1.6" fill={tint} stroke={color} strokeWidth={SW * 0.9} />
      <Rect x="7.8" y="12.5" width="3.4" height="3.4" rx="1" fill={tint} stroke={color} strokeWidth={SW * 0.9} />
      <Rect x="12.8" y="12.5" width="3.4" height="3.4" rx="1" stroke={color} strokeWidth={SW * 0.9} />
    </Base>
  );
}

/* ── Phone + lock — Lock Screen ────────────────────────── */
export function LockScreenGlyph({ size, color, tint = 'transparent' }: GlyphProps) {
  return (
    <Base size={size}>
      <Rect x="5" y="2.5" width="14" height="19" rx="3" stroke={color} strokeWidth={SW} />
      <Rect x="9.3" y="12.4" width="5.4" height="4.6" rx="1.2" fill={tint} stroke={color} strokeWidth={SW * 0.95} />
      <Path d="M10.6 12.4V11C10.6 10.2 11.2 9.6 12 9.6C12.8 9.6 13.4 10.2 13.4 11V12.4"
        stroke={color} strokeWidth={SW * 0.95} strokeLinecap="round" />
      <Circle cx="12" cy="14.5" r="0.8" fill={color} />
    </Base>
  );
}

/* ── Open book + crescent — Quran ──────────────────────── */
export function QuranGlyph({ size, color, tint = 'transparent' }: GlyphProps) {
  return (
    <Base size={size}>
      <Path d="M12 9.2C10.2 7.8 7 7.6 4.8 8.4V18C7 17.2 10.2 17.4 12 18.6Z"
        fill={tint} stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M12 9.2C13.8 7.8 17 7.6 19.2 8.4V18C17 17.2 13.8 17.4 12 18.6Z"
        fill="none" stroke={color} strokeWidth={SW} strokeLinejoin="round" />
      <Path d="M13.4 4.4C12.4 4.7 11.7 5.6 11.7 6.7C11.7 7.8 12.4 8.7 13.4 9C12.9 9.2 12.3 9.3 11.7 9.1"
        stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" strokeLinejoin="round" />
    </Base>
  );
}

/* ── Cupped hands + light — Duas ───────────────────────── */
export function DuaGlyph({ size, color, tint = 'transparent' }: GlyphProps) {
  return (
    <Base size={size}>
      {/* bowl of hands */}
      <Path d="M4.5 13C4.5 18 7.8 20.5 12 20.5C16.2 20.5 19.5 18 19.5 13"
        fill={tint} stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <Path d="M12 20.5V14.5" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      {/* thumbs */}
      <Path d="M4.5 13C4.2 11 5.2 9.8 7 10.4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      <Path d="M19.5 13C19.8 11 18.8 9.8 17 10.4" stroke={color} strokeWidth={SW} strokeLinecap="round" />
      {/* light from above */}
      <Path d="M12 3.2C11.3 4 11.3 5.2 12 6C11 5.8 10.4 5 10.6 4.1"
        stroke={color} strokeWidth={SW * 0.9} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="7.5" cy="6.5" r="0.7" fill={color} />
      <Circle cx="16.5" cy="6.5" r="0.7" fill={color} />
    </Base>
  );
}

/* ── Registry ──────────────────────────────────────────── */
export type GlyphName =
  | 'mosque' | 'compass' | 'beads' | 'bell'
  | 'widget' | 'lockscreen' | 'quran' | 'dua';

export const GLYPHS: Record<GlyphName, React.FC<GlyphProps>> = {
  mosque: MosqueGlyph,
  compass: CompassGlyph,
  beads: BeadsGlyph,
  bell: BellGlyph,
  widget: WidgetGlyph,
  lockscreen: LockScreenGlyph,
  quran: QuranGlyph,
  dua: DuaGlyph,
};

export function AppGlyph({ name, ...props }: { name: GlyphName } & GlyphProps) {
  const C = GLYPHS[name];
  return <C {...props} />;
}
