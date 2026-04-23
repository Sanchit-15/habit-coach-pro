import { useEffect, useState } from 'react';
import './Confetti.css';

// Pieces float up then fall while drifting sideways and rotating
const COLORS = ['#E8553A', '#2F80ED', '#27AE60', '#F5A623', '#9B59B6', '#1ABC9C', '#FF6B9D'];

export default function Confetti({ trigger }) {
  // pieces is an array of { id, left, color, delay, drift, rotate }
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    // Generate ~40 confetti pieces with random positions/colors/delays
    const items = Array.from({ length: 40 }).map((_, i) => ({
      id: `${trigger}-${i}`,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.3,
      drift: (Math.random() - 0.5) * 200,
      rotate: Math.random() * 720 - 360,
      duration: 1.5 + Math.random() * 1.2,
    }));
    setPieces(items);
    // Clean up after the longest animation finishes
    const t = setTimeout(() => setPieces([]), 3000);
    return () => clearTimeout(t);
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="confetti-root" aria-hidden="true">
      {pieces.map(p => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            // CSS variables consumed by the keyframe animation
            '--drift': `${p.drift}px`,
            '--rotate': `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
