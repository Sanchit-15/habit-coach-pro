import { useEffect } from 'react';
import './UndoToast.css';

// Lives at the bottom-center; auto-dismisses after `duration` ms
export default function UndoToast({ message, onUndo, onDismiss, duration = 5000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDismiss(), duration);
    return () => clearTimeout(t);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <div className="undo-toast" role="status">
      <span className="undo-toast-msg">{message}</span>
      <button className="undo-toast-btn" onClick={onUndo}>Undo</button>
      <button className="undo-toast-close" onClick={onDismiss} aria-label="Dismiss">×</button>
    </div>
  );
}
