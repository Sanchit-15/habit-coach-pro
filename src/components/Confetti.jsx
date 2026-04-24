import { useMemo } from 'react'; // React hook to memoize confetti pieces between renders
import './Confetti.css'; // Plain CSS file with the falling animation

// Color palette used to randomly tint each piece
const COLORS = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C', '#E91E63'];

// Fullscreen confetti overlay shown only when `active` is true
export default function Confetti({ active }) {
  // Build 80 pieces with stable random props — only recompute when `active` flips on
  const pieces = useMemo(() => {
    // If not active we don't need to compute anything
    if (!active) return [];
    // Create an array of 80 confetti piece descriptors
    return Array.from({ length: 80 }, (_, i) => ({
      id: i, // unique key for React
      left: Math.random() * 100, // horizontal start position in vw
      delay: Math.random() * 0.5, // animation delay so pieces stagger
      duration: 1.8 + Math.random() * 1.4, // total fall time in seconds
      color: COLORS[Math.floor(Math.random() * COLORS.length)], // random color
      rotate: Math.random() * 360, // initial rotation
      size: 6 + Math.random() * 8, // width in px
    }));
  }, [active]);

  // When inactive, render nothing (keeps DOM clean)
  if (!active) return null;

  // Fixed overlay covering full viewport, never blocking clicks
  return (
    <div className="confetti-overlay" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={p.id} // unique key
          className="confetti-dot" // shared CSS class with the falling animation
          style={{
            left: `${p.left}vw`, // horizontal start
            background: p.color, // random color
            width: `${p.size}px`, // width
            height: `${p.size * 1.6}px`, // taller than wide for ribbon shape
            animationDelay: `${p.delay}s`, // stagger
            animationDuration: `${p.duration}s`, // fall speed
            transform: `rotate(${p.rotate}deg)`, // initial rotation
          }}
        />
      ))}
    </div>
  );
}
